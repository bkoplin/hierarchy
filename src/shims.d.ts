import chroma from 'chroma-js'
import type {
  JsonObject,
  LiteralUnion, SetNonNullable,
  SetRequired, Writable
} from 'type-fest'
import { angleConverter } from 'src'

declare module 'd3-hierarchy' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface HierarchyNode<Datum = [ string, JsonObject ]> {
    label: string | null
    color: string | null
    name: string | null
    id: string | number | null
    height: number
    parentId: string | number | null
    value: number
    children?: Writable<this>[]
    data: Datum
    datum: JsonObject | null
    midPointAngle: {
      radians: number
      degrees: number
      rotations: number
      paper: number
      side: 'left' | 'right'
    }
    nodeArcWidth: {
      radians: number
      degrees: number
    }
    startAngle: number
    paperAngles: {
      startAngle: number
      endAngle: number
      padAngle: number
      midPointAngle: number
    }
    angleConverter: typeof angleConverter
    endAngle: number
    padAngle: number
    parent: Writable<this> | null
    dim: string | null
    leaves (): Writable<HierarchyNode<Array<JsonObject> | JsonObject>>[]
    leafNodes (): Writable<this>[]
    parentIndex: number | null
    parentList: Writable<this>[]
    parentIdList: (string | number | null)[]
    dimPath: (string | null)[]
    idPath: (string | number | null)[]
    records: JsonObject[]
    ancestorAt<Depth extends number> (
      depth: Depth
    ): Writable<this> | undefined
    ancestorAt (dimName: string): Writable<this> | undefined
    hasParent (): this is SetNonNullable<Writable<this>, 'parent'>
    hasChildren (): this is SetRequired<Writable<this>, 'children'>
    collapseOnlyChildren: () => Writable<this>
    descendantsAt (depth: number): Writable<this>[]
    descendantsAt (dimName: string): Writable<this>[]
    rootNodesAt (level: number): Writable<this>[]
    rootNodesAt (dimName: string | null): Writable<this>[]
    eachBefore (
      callback: (node: Writable<this>, index: number) => void
    ): Writable<this>
    each (
      callback: (node: Writable<this>, index: number) => void
    ): Writable<this>
    aggregate (
      this: Writable<this>,
      aggFunction: 'sum' |
        'mean' |
        'median' |
        'mode' |
        'count' |
        'count (distinct)' |
        Function,
      valueField: string
    ): Writable<this>
    aggregates (
      this: Writable<this>,
      aggFunction: 'sum' |
        'mean' |
        'median' |
        'mode' |
        'count' |
        'count (distinct)' |
        Function,
      valueField: string
    ): Record<string, number>
    setNodeName (this: Writable<this>, nameFields: string[]): Writable<this>
    setColor (
      this: Writable<this>,
      colorScale: keyof chroma.ChromaStatic[ 'brewer' ]
    ): Writable<this>
    setColor (
      this: Writable<this>,
      colorScale: Array<keyof chroma.ChromaStatic[ 'brewer' ]>,
      type: 'byParent'
    ): Writable<this>
    makePies (
      this: Writable<this>,
      pieStart: number,
      pieEnd: number,
      piePadding?: LiteralUnion<0, number>,
      paddingMaxDepth?: LiteralUnion<0, number>
    ): Writable<this>
  }

  interface HierarchyCircularNode<Datum = [ string, JsonObject ]> extends HierarchyNode<Datum> {
    /**
     * The x-coordinate of the circle’s center.
     */
    x: number

    /**
     * The y-coordinate of the circle’s center.
     */
    y: number

    /**
     * The radius of the circle.
     */
    r: number

    /**
     * Returns an array of links for this node, where each link is an object that defines source and target properties.
     * The source of each link is the parent node, and the target is a child node.
     */
    links (): Array<HierarchyCircularLink<Datum>>
  }

  interface PackLayout<Datum = [ string, JsonObject ]> {
    /**
     * Lays out the specified root hierarchy.
     * You must call `root.sum` before passing the hierarchy to the pack layout.
     * You probably also want to call `root.sort` to order the hierarchy before computing the layout.
     *
     * @param root The specified root hierarchy.
     */
    (root: HierarchyNode<Datum>): HierarchyCircularNode<Datum>

    /**
     * Returns the current radius accessor, which defaults to null.
     */
    radius (): null | ((node: HierarchyCircularNode<Datum>) => number)
    /**
     * Sets the pack layout’s radius accessor to the specified function and returns this pack layout.
     * If the radius accessor is null, the radius of each leaf circle is derived from the leaf `node.value` (computed by `node.sum`);
     * the radii are then scaled proportionally to fit the layout size.
     * If the radius accessor is not null, the radius of each leaf circle is specified exactly by the function.
     *
     * @param radius The specified radius accessor.
     */
    radius (radius: null | ((node: HierarchyCircularNode<Datum>) => number)): this

    /**
     * Returns the current size, which defaults to [1, 1].
     */
    size (): [ number, number ]
    /**
     * Sets this pack layout’s size to the specified [width, height] array and returns this pack layout.
     *
     * @param size The specified two-element size array.
     */
    size (size: [ number, number ]): this

    /**
     * Returns the current padding accessor, which defaults to the constant zero.
     */
    padding (): (node: HierarchyCircularNode<Datum>) => number
    /**
     * Sets this pack layout’s padding accessor to the specified number and returns this pack layout.
     * Returns the current padding accessor, which defaults to the constant zero.
     *
     * When siblings are packed, tangent siblings will be separated by approximately the specified padding;
     * the enclosing parent circle will also be separated from its children by approximately the specified padding.
     * If an explicit radius is not specified, the padding is approximate because a two-pass algorithm
     * is needed to fit within the layout size: the circles are first packed without padding;
     * a scaling factor is computed and applied to the specified padding; and lastly the circles are re-packed with padding.
     *
     * @param padding The specified padding value.
     */
    padding (padding: number): this
    /**
     * Sets this pack layout’s padding accessor to the specified function and returns this pack layout.
     * Returns the current padding accessor, which defaults to the constant zero.
     *
     * When siblings are packed, tangent siblings will be separated by approximately the specified padding;
     * the enclosing parent circle will also be separated from its children by approximately the specified padding.
     * If an explicit radius is not specified, the padding is approximate because a two-pass algorithm
     * is needed to fit within the layout size: the circles are first packed without padding;
     * a scaling factor is computed and applied to the specified padding; and lastly the circles are re-packed with padding.
     *
     * @param padding The specified padding function.
     */
    padding (padding: (node: HierarchyCircularNode<Datum>) => number): this
  }
}
