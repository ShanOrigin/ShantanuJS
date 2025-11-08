Short-Circuit Usage Style Guide

This configuration file defines the style rules for using short-circuiting (&& / ||) in our graphics and animation library.


---

1. When to Use Short-Circuit

1, 2, or 3 conditions:

Ideal for simple checks.

Use short-circuiting for inline function calls or assignments.



isScale && applyScale(sx, sy);
userInput || useDefault();
condition1 && condition2 && doSomething();

Rule: Always prefer short-circuit when there are 1, 2, or 3 conditions.


---

2. When to Use if / else Blocks

More than 3 conditions:

For clarity and maintainability, use if / else blocks.



if (a && b && c && d) {
  doSomethingComplex();
}

Control flow statements (return, throw, break, continue):

Short-circuit cannot handle these, use if blocks.



if (!someCondition) return value;
if (!someCondition) throw new Error('Oops');

Nested or complex logic:

Break into multiple if / else blocks to avoid confusion.




---

3. Special Rules

Inline assignment / function call: Short-circuit can be used.

Error handling / returns: Use if blocks.

Avoid deep nested short-circuits: If it gets hard to read, use if blocks.



---

4. Decision Table

Condition Complexity	Recommended Approach	Notes

1–3 conditions	Short-circuit (&& / 	
More than 3	if / else block	Maintain readability and clarity
Return / Throw	if block only	Short-circuit cannot handle control flow
Nested logic	Split into if / else	Avoid deep inline confusion



---

5. Philosophy

Short-circuiting is a stylistic tool.

Use it to simplify logic without losing clarity.

Default to if blocks for complex logic, more than 3 conditions, or control flow changes.



---

End of Style Guide


