# Testing User Interactions and State Changes

## Overview

User interactions are the core of React Testing Library's philosophy. Testing interactions simulates real user behavior—typing, clicking, hovering, selecting—rather than triggering individual DOM events.

## userEvent vs fireEvent

### Key Differences

| Aspect | fireEvent | userEvent |
|--------|-----------|-----------|
| **Event Dispatch** | Single DOM event | Complete interaction sequence |
| **User Simulation** | Low-level | High-level, realistic |
| **Visibility Check** | No | Yes, won't interact with hidden elements |
| **Disabled Elements** | Allows interaction | Respects disabled state |
| **Async** | Synchronous | Async (returns Promise) |
| **Use Case** | Edge cases | Primary choice |

### Example Comparison

```typescript
import { render, screen } from '@testing-library/react'
import fireEvent from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function TextInput() {
  const [value, setValue] = React.useState('')
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => console.log('blurred')}
    />
  )
}

// fireEvent - only triggers change event
test('fireEvent typing', () => {
  render(<TextInput />)
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: 'hello' } })
  expect(input).toHaveValue('hello')
  // keydown, keyup events NOT fired
})

// userEvent - realistic sequence
test('userEvent typing', async () => {
  const user = userEvent.setup()
  render(<TextInput />)
  const input = screen.getByRole('textbox')

  // Focuses, types, fires keydown/keyup for each character
  await user.type(input, 'hello')
  expect(input).toHaveValue('hello')
  // Full interaction sequence simulated
})
```

## userEvent API and Methods

### Setup Pattern

Always initialize userEvent before rendering:

```typescript
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'

test('user interactions', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)

  // Now use user instance
  await user.click(screen.getByRole('button'))
})
```

### Common Methods

#### 1. Typing Text

```typescript
test('typing in input field', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)
  const emailInput = screen.getByLabelText(/email/i)

  // Type gradually, firing keydown/keyup for each char
  await user.type(emailInput, 'test@example.com')
  expect(emailInput).toHaveValue('test@example.com')
})

// Type with options
test('typing with special keys', async () => {
  const user = userEvent.setup()
  render(<SearchInput />)
  const input = screen.getByRole('textbox')

  await user.type(input, 'search term{Enter}')
  // {Enter}, {Tab}, {Escape}, etc. supported
})

// Selecting and replacing
test('select all and type', async () => {
  const user = userEvent.setup()
  render(<EditableField initialValue="old text" />)
  const input = screen.getByDisplayValue('old text')

  await user.tripleClick(input) // Select all
  await user.type(input, 'new text')
  expect(input).toHaveValue('new text')
})
```

#### 2. Clicking Elements

```typescript
test('clicking buttons', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()
  render(<button onClick={handleClick}>Click me</button>)

  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledOnce()
})

test('double clicking', async () => {
  const user = userEvent.setup()
  const handleDoubleClick = vi.fn()
  render(
    <div onDoubleClick={handleDoubleClick}>
      Double click me
    </div>
  )

  await user.dblClick(screen.getByText('Double click me'))
  expect(handleDoubleClick).toHaveBeenCalled()
})

// Click with options
test('click with options', async () => {
  const user = userEvent.setup()
  render(<Button />)

  // Right click
  await user.click(screen.getByRole('button'), { button: 'right' })

  // Multiple click (for checkboxes)
  await user.click(screen.getByRole('checkbox'), { clickCount: 2 })
})
```

#### 3. Keyboard Navigation

```typescript
test('keyboard navigation', async () => {
  const user = userEvent.setup()
  render(
    <select>
      <option>Option 1</option>
      <option>Option 2</option>
    </select>
  )

  const select = screen.getByRole('combobox')
  select.focus()

  // Arrow keys
  await user.keyboard('[ArrowDown]')
  expect(select).toHaveValue('Option 2')

  // Tab navigation
  await user.tab()
  expect(screen.getByRole('button')).toHaveFocus()
})

test('special key sequences', async () => {
  const user = userEvent.setup()
  render(<TextField />)

  // Ctrl+A to select all
  await user.keyboard('{Control>}a{/Control}')

  // Shift+Tab for reverse tab
  await user.keyboard('{Shift>}{Tab}{/Shift}')
})
```

#### 4. Hovering

```typescript
test('hover to show tooltip', async () => {
  const user = userEvent.setup()
  render(
    <div>
      <button>Hover me</button>
      {/* tooltip initially hidden */}
    </div>
  )

  const button = screen.getByRole('button')

  // Tooltip not visible yet
  expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()

  // Hover reveals tooltip
  await user.hover(button)
  expect(screen.getByText('Tooltip')).toBeInTheDocument()

  // Unhover hides tooltip
  await user.unhover(button)
  expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
})
```

#### 5. Select Options

```typescript
test('selecting options', async () => {
  const user = userEvent.setup()
  render(
    <select>
      <option>Red</option>
      <option>Blue</option>
      <option selected>Green</option>
    </select>
  )

  const select = screen.getByRole('combobox')
  expect(select).toHaveValue('Green')

  // Change selection
  await user.selectOptions(select, 'Red')
  expect(select).toHaveValue('Red')
})

// Multi-select
test('multi-select', async () => {
  const user = userEvent.setup()
  render(
    <select multiple>
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
    </select>
  )

  const select = screen.getByRole('listbox')
  await user.selectOptions(select, ['Option 1', 'Option 3'])

  expect(select).toHaveValue(['Option 1', 'Option 3'])
})
```

#### 6. Uploading Files

```typescript
test('file upload', async () => {
  const user = userEvent.setup()
  const handleChange = vi.fn()

  render(
    <input
      type="file"
      onChange={handleChange}
      accept="image/*"
    />
  )

  const file = new File(['content'], 'test.txt', { type: 'text/plain' })
  const input = screen.getByRole('button')

  await user.upload(input, file)

  expect(handleChange).toHaveBeenCalledOnce()
  expect(handleChange.mock.calls[0][0].target.files).toHaveLength(1)
})
```

## Testing State Changes

### Simple State Updates

```typescript
function Counter() {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

test('state updates on button click', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  expect(screen.getByText('Count: 0')).toBeInTheDocument()

  await user.click(screen.getByRole('button'))

  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### Async State Updates

```typescript
function AsyncCounter() {
  const [count, setCount] = React.useState(0)

  const handleIncrement = async () => {
    await new Promise(r => setTimeout(r, 100))
    setCount(c => c + 1)
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}

test('async state updates', async () => {
  const user = userEvent.setup()
  render(<AsyncCounter />)

  await user.click(screen.getByRole('button'))

  // Wait for state update
  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})
```

### Form State Management

```typescript
function Form() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subscribe: false
  })

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <form>
      <input
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
      <label>
        <input
          name="subscribe"
          type="checkbox"
          checked={formData.subscribe}
          onChange={handleChange}
        />
        Subscribe
      </label>
    </form>
  )
}

test('form state changes with user input', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const nameInput = screen.getByPlaceholderText('Name')
  const emailInput = screen.getByPlaceholderText('Email')
  const checkbox = screen.getByRole('checkbox')

  await user.type(nameInput, 'John Doe')
  await user.type(emailInput, 'john@example.com')
  await user.click(checkbox)

  expect(nameInput).toHaveValue('John Doe')
  expect(emailInput).toHaveValue('john@example.com')
  expect(checkbox).toBeChecked()
})
```

## Best Practices

### DO:
- Always use `userEvent` over `fireEvent`
- Initialize with `userEvent.setup()` before rendering
- `await` all user interactions (they return Promises)
- Test user-visible behavior, not implementation details
- Test edge cases: empty values, special characters, rapid clicks
- Use semantic queries like `getByRole` for interactions

### DON'T:
- Use `fireEvent` except in specific edge cases
- Forget to `await` async methods
- Test internal state directly
- Make assertions about call counts on unrelated handlers
- Interact with hidden or disabled elements (userEvent prevents this)

## Key References

- **userEvent Documentation**: https://testing-library.com/docs/user-event/intro/
- **userEvent GitHub**: https://github.com/testing-library/user-event
- **How to Test User Interactions**: https://www.freecodecamp.org/news/how-to-test-user-interactions-in-react/
- **fireEvent vs userEvent**: https://blog.mimacom.com/react-testing-library-fireevent-vs-userevent/

## Summary

Use `userEvent.setup()` to initialize user interactions, then simulate realistic user behavior using methods like `type()`, `click()`, `hover()`, and `selectOptions()`. Always `await` these methods. Test state changes by verifying visible output rather than internal state.
