import { Frame, LiveFrame } from './frame'
import { Fractal } from './fractal'
import { Temporary } from './helpers'
import { ContextQuery, BuilderQuery } from './queries'

export type Bubble<T> = T | Fractal<T> | Frame<T> | LiveFrame<T> | Temporary<T> | ContextQuery | BuilderQuery

export type Projection<T> = T | Fractal<T> | Promise<T | Fractal<T>>
