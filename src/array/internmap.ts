import type {
  JsonObject, JsonPrimitive,
} from 'type-fest'

export class InternMap extends Map {
  _intern: Map<any, any>
  _key: <T extends JsonPrimitive | JsonObject>(value: T) => Object | T
  constructor(entries: null | ConstructorParameters<typeof Map>[0], keyFn = keyof) {
    super()
    this._intern = new Map()
    this._key = keyFn
    if (entries != null) {
      for (const [
        key,
        value,
      ] of entries) {
        this.set(
          key,
          value
        )
      }
    }
  }

  get(key: JsonPrimitive | JsonObject) {
    return super.get(intern_get(
      this,
      key
    ))
  }

  has(key) {
    return super.has(intern_get(
      this,
      key
    ))
  }

  set(key, value) {
    return super.set(
      intern_set(
        this,
        key
      ),
      value
    )
  }

  delete(key) {
    return super.delete(intern_delete(
      this,
      key
    ))
  }
}
export class InternSet extends Set {
  _intern: Map<any, any>
  _key: <T extends JsonPrimitive | JsonObject>(value: T) => Object | T
  constructor(values: null | ConstructorParameters<typeof Set>[0], keyFn = keyof) {
    super()
    this._intern = new Map()
    this._key = keyFn
    if (values != null)
      for (const value of values) this.add(value)
  }

  has(value) {
    return super.has(intern_get(
      this,
      value
    ))
  }

  add(value) {
    return super.add(intern_set(
      this,
      value
    ))
  }

  delete(value) {
    return super.delete(intern_delete(
      this,
      value
    ))
  }
}

function intern_get({
  _intern, _key,
}: InstanceType<typeof InternMap> | InstanceType<typeof InternSet>, value: JsonPrimitive | JsonObject) {
  const key = _key(value)

  return _intern.has(key) ? _intern.get(key) : value
}

function intern_set({
  _intern, _key,
}: InstanceType<typeof InternMap> | InstanceType<typeof InternSet>, value: JsonPrimitive | JsonObject) {
  const key = _key(value)

  if (_intern.has(key))
    return _intern.get(key)
  _intern.set(
    key,
    value
  )
  return value
}

function intern_delete({
  _intern, _key,
}: InstanceType<typeof InternMap> | InstanceType<typeof InternSet>, value: JsonPrimitive | JsonObject) {
  const key = _key(value)

  if (_intern.has(key)) {
    value = _intern.get(key)
    _intern.delete(key)
  }
  return value
}

function keyof<T extends JsonPrimitive | JsonObject>(value: T) {
  return value !== null && typeof value === 'object' ? value.valueOf() : value
}
