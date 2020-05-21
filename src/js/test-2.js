export const greeting = 'hello there';

export function sayHelloTo(name) {
  return `Why ${greeting}, ${name}`
}

// Can use single export statement at end of your module file, followed by a comma-separated list of the features you want to export wrapped in curly braces. For example:
// export { greeting, sayHelloTo };

// Note: In some module systems, you can omit the file extension and the dot (e.g. '/modules/square'). This doesn't work in native JavaScript modules.
