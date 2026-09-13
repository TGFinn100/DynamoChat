// Minimal reader for Unreal Engine's "GVAS" SaveGame binary format, scoped to
// exactly the property types Ready or Not's save files use (verified against
// a real save on disk, and cross-checked against the byte layout used by the
// open-source `gvas` Rust crate at github.com/localcc/gvas). Not a general
// GVAS parser - unsupported property types throw rather than guess, since a
// wrong guess about an unknown type's header shape silently corrupts every
// byte offset after it.

export interface GvasProperty {
  name: string;
  type: string;
  value: unknown;
}

export interface GvasStructValue {
  structType: string | null;
  fields: GvasProperty[];
}

export interface GvasMapValue {
  keyType: string;
  valueType: string;
  entries: Array<{ key: unknown; value: unknown }>;
}

class GvasCursor {
  pos = 0;
  constructor(private buf: Buffer) {}

  u8(): number {
    const v = this.buf.readUInt8(this.pos);
    this.pos += 1;
    return v;
  }
  u16(): number {
    const v = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return v;
  }
  u32(): number {
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }
  i32(): number {
    const v = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return v;
  }
  f32(): number {
    const v = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return v;
  }
  skip(n: number): void {
    this.pos += n;
  }
  ascii4(): string {
    const str = this.buf.toString("ascii", this.pos, this.pos + 4);
    this.pos += 4;
    return str;
  }
  /** Unreal's FString: int32 length (positive = ANSI incl. null terminator, negative = UTF-16, zero = empty/null). */
  fstring(): string | null {
    const len = this.i32();
    if (len === 0) return null;
    if (len < 0) {
      const charCount = -len - 1;
      const byteLen = charCount * 2;
      const str = this.buf.toString("utf16le", this.pos, this.pos + byteLen);
      this.pos += byteLen + 2;
      return str;
    }
    const byteLen = len - 1;
    const str = this.buf.toString("utf8", this.pos, this.pos + byteLen);
    this.pos += byteLen + 1;
    return str;
  }
}

function skipHeader(c: GvasCursor): void {
  const magic = c.ascii4();
  if (magic !== "GVAS") {
    throw new Error(`Not a GVAS save file (magic was "${magic}")`);
  }
  const version = c.u32();
  c.u32(); // package_file_version
  if (version >= 3) c.u32(); // package_file_version_ue5 (only present from header version 3)
  c.u16();
  c.u16();
  c.u16();
  c.u32(); // engine version: major, minor, patch, changelist
  c.fstring(); // engine branch
  c.u32(); // custom_version_format
  const numCustomVersions = c.u32();
  for (let i = 0; i < numCustomVersions; i++) {
    c.skip(16); // guid
    c.u32(); // version
  }
  c.fstring(); // save_game_class_name
}

function readPropertyList(c: GvasCursor): GvasProperty[] {
  const props: GvasProperty[] = [];
  for (;;) {
    const name = c.fstring();
    if (name === null || name === "None") break;
    const type = c.fstring();
    if (type === null) throw new Error(`Property "${name}" has no type`);
    const value = readPropertyValueWithHeader(c, type);
    props.push({ name, type, value });
  }
  return props;
}

function readPropertyValueWithHeader(c: GvasCursor, type: string): unknown {
  const size = c.u32();
  c.u32(); // array_index, expected 0

  switch (type) {
    case "IntProperty": {
      c.u8(); // terminator
      return c.i32();
    }
    case "FloatProperty": {
      c.u8();
      return c.f32();
    }
    case "BoolProperty": {
      const value = c.u8() !== 0;
      c.u8();
      return value;
    }
    case "StrProperty":
    case "NameProperty": {
      c.u8();
      return c.fstring();
    }
    case "StructProperty": {
      const structType = c.fstring();
      c.skip(16); // guid
      c.u8(); // terminator
      const bodyStart = c.pos;
      const fields = readPropertyList(c);
      assertConsumed(c, bodyStart, size, `StructProperty(${structType ?? ""})`);
      return { structType, fields } satisfies GvasStructValue;
    }
    case "MapProperty": {
      const keyType = c.fstring() ?? "";
      const valueType = c.fstring() ?? "";
      c.u8(); // terminator
      const bodyStart = c.pos;
      c.u32(); // allocation_flags
      const count = c.u32();
      const entries: Array<{ key: unknown; value: unknown }> = [];
      for (let i = 0; i < count; i++) {
        const key = readPropertyValueHeaderless(c, keyType);
        const value = readPropertyValueHeaderless(c, valueType);
        entries.push({ key, value });
      }
      assertConsumed(c, bodyStart, size, "MapProperty");
      return { keyType, valueType, entries } satisfies GvasMapValue;
    }
    default:
      throw new Error(`Unsupported property type "${type}" - refusing to guess its header shape`);
  }
}

function readPropertyValueHeaderless(c: GvasCursor, type: string): unknown {
  switch (type) {
    case "IntProperty":
      return c.i32();
    case "FloatProperty":
      return c.f32();
    case "BoolProperty":
      return c.u8() !== 0;
    case "StrProperty":
    case "NameProperty":
      return c.fstring();
    case "StructProperty": {
      // No wrapper (no type_name/guid) when a struct is a map/array VALUE -
      // every struct this app reads is a plain property bag, never one of
      // Unreal's compact built-in types (Vector/Guid/DateTime/...), so this
      // is safe for our data even though it wouldn't be safe in general.
      const fields = readPropertyList(c);
      return { structType: null, fields } satisfies GvasStructValue;
    }
    default:
      throw new Error(`Unsupported headerless map/array value type "${type}"`);
  }
}

function assertConsumed(c: GvasCursor, bodyStart: number, declaredSize: number, what: string): void {
  const consumed = c.pos - bodyStart;
  if (consumed !== declaredSize) {
    throw new Error(
      `${what} declared size ${declaredSize} but consumed ${consumed} bytes - save file format assumption broken`,
    );
  }
}

export function parseGvasProperties(buffer: Buffer): GvasProperty[] {
  const c = new GvasCursor(buffer);
  skipHeader(c);
  return readPropertyList(c);
}

export function findProperty(list: GvasProperty[], name: string): GvasProperty | undefined {
  return list.find((p) => p.name === name);
}
