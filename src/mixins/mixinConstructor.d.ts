/**
 * Generic constructor type used for mixin extensions.
 *
 * This allows a mixin to accept *any* class (including generic classes)
 * and return a new class that extends it, without losing the original
 * instance type or constructor arguments.
 *
 * T = instance type of the class.
 */

export type Constructor<T = {}> = abstract new (...args: any[]) => T;
