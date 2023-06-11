export default function (callback, that) {
  let index = -1
  const self = [this]

  for (const node of self) {
    if (callback.call(
      that,
      node,
      ++index,
      self
    ))
      return node
  }
}
