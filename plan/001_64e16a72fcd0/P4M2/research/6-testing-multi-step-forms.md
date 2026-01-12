# Best Practices for Testing Multi-Step Forms

## Overview

Multi-step forms present unique testing challenges: state management across steps, form validation at each stage, navigation between steps, and submission handling. A test-driven approach ensures robust form behavior.

## Form Architecture Patterns

### Pattern 1: Context-Based Step Management

```typescript
// FormContext.ts
interface FormContextType {
  currentStep: number
  formData: FormData
  isValid: boolean
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  updateField: (name: string, value: any) => void
  submitForm: () => Promise<void>
}

export const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<FormData>({})
  const [isValid, setIsValid] = React.useState(false)

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const nextStep = () => {
    if (isStepValid(currentStep, formData)) {
      setCurrentStep(s => s + 1)
    }
  }

  const previousStep = () => {
    setCurrentStep(s => Math.max(0, s - 1))
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step)
    }
  }

  const submitForm = async () => {
    const response = await api.submitForm(formData)
    return response
  }

  return (
    <FormContext.Provider
      value={{
        currentStep,
        formData,
        isValid,
        nextStep,
        previousStep,
        goToStep,
        updateField,
        submitForm
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useForm() {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within FormProvider')
  }
  return context
}
```

### Pattern 2: useState-Based Approach

```typescript
interface MultiStepFormProps {
  onSubmit: (data: FormData) => Promise<void>
}

function MultiStepForm({ onSubmit }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<FormData>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateStep = (): boolean => {
    const stepErrors = validateStepData(currentStep, formData)
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = async () => {
    if (validateStep()) {
      setCurrentStep(s => s + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(s => Math.max(0, s - 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return

    try {
      setIsLoading(true)
      await onSubmit(formData)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {currentStep === 0 && (
        <PersonalInfoStep
          data={formData}
          errors={errors}
          onChange={handleFieldChange}
        />
      )}
      {currentStep === 1 && (
        <AddressStep
          data={formData}
          errors={errors}
          onChange={handleFieldChange}
        />
      )}
      {currentStep === 2 && (
        <ReviewStep data={formData} />
      )}

      <div>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        {currentStep < 2 ? (
          <button type="button" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </form>
  )
}
```

## Testing Multi-Step Forms

### Test 1: Navigation Between Steps

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('navigates through all form steps', async () => {
  const user = userEvent.setup()

  render(
    <MultiStepForm onSubmit={vi.fn()} />
  )

  // Step 1: Personal Info
  expect(screen.getByText(/Step 1: Personal Information/i)).toBeInTheDocument()

  const nameInput = screen.getByLabelText(/name/i)
  const emailInput = screen.getByLabelText(/email/i)

  await user.type(nameInput, 'John Doe')
  await user.type(emailInput, 'john@example.com')

  // Go to step 2
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 2: Address
  expect(screen.getByText(/Step 2: Address/i)).toBeInTheDocument()

  const streetInput = screen.getByLabelText(/street/i)
  const cityInput = screen.getByLabelText(/city/i)

  await user.type(streetInput, '123 Main St')
  await user.type(cityInput, 'Springfield')

  // Go to step 3
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: Review
  expect(screen.getByText(/Step 3: Review/i)).toBeInTheDocument()
  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('123 Main St')).toBeInTheDocument()
})
```

### Test 2: Form Validation at Each Step

```typescript
test('validates required fields before next step', async () => {
  const user = userEvent.setup()

  render(
    <MultiStepForm onSubmit={vi.fn()} />
  )

  // Try to go to next step without filling required fields
  const nextButton = screen.getByRole('button', { name: /next/i })
  await user.click(nextButton)

  // Should show validation errors
  expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  expect(screen.getByText(/email is required/i)).toBeInTheDocument()

  // Should still be on step 1
  expect(screen.getByText(/Step 1: Personal Information/i)).toBeInTheDocument()

  // Fill required fields
  await user.type(screen.getByLabelText(/name/i), 'John')
  await user.type(screen.getByLabelText(/email/i), 'john@test.com')

  // Now next should work
  await user.click(nextButton)
  expect(screen.getByText(/Step 2: Address/i)).toBeInTheDocument()
})

test('validates email format', async () => {
  const user = userEvent.setup()

  render(
    <MultiStepForm onSubmit={vi.fn()} />
  )

  const emailInput = screen.getByLabelText(/email/i)
  await user.type(emailInput, 'invalid-email')

  await user.click(screen.getByRole('button', { name: /next/i }))

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
})
```

### Test 3: Going Back and Preserving Data

```typescript
test('preserves form data when navigating back', async () => {
  const user = userEvent.setup()

  render(
    <MultiStepForm onSubmit={vi.fn()} />
  )

  // Fill step 1
  const nameInput = screen.getByLabelText(/name/i)
  const emailInput = screen.getByLabelText(/email/i)

  await user.type(nameInput, 'John Doe')
  await user.type(emailInput, 'john@example.com')

  // Go to step 2
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Fill step 2
  const streetInput = screen.getByLabelText(/street/i)
  await user.type(streetInput, '123 Main St')

  // Go back to step 1
  await user.click(screen.getByRole('button', { name: /previous/i }))

  // Data should be preserved
  expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
  expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
})
```

### Test 4: Form Submission

```typescript
test('submits form with all data', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn().mockResolvedValue(undefined)

  render(
    <MultiStepForm onSubmit={handleSubmit} />
  )

  // Fill step 1
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Fill step 2
  await user.type(screen.getByLabelText(/street/i), '123 Main St')
  await user.type(screen.getByLabelText(/city/i), 'Springfield')
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'John Doe',
      email: 'john@example.com',
      street: '123 Main St',
      city: 'Springfield'
    })
  )
})

test('shows loading state during submission', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn(
    () => new Promise(r => setTimeout(r, 100))
  )

  render(
    <MultiStepForm onSubmit={handleSubmit} />
  )

  // Navigate to review step and submit
  // ... fill form steps ...
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Should show loading state
  expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument()

  // Wait for submission
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })
})
```

### Test 5: Error Handling

```typescript
test('handles submission errors', async () => {
  const user = userEvent.setup()
  const error = new Error('API Error')
  const handleSubmit = vi.fn().mockRejectedValue(error)

  render(
    <MultiStepForm onSubmit={handleSubmit} />
  )

  // Fill and submit form
  // ... navigation and filling ...
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Should show error message
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
  })

  // Submit button should be re-enabled
  expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
})
```

### Test 6: Using Context-Based Form

```typescript
test('multi-step form with context', async () => {
  const user = userEvent.setup()

  const TestComponent = () => {
    const { currentStep, nextStep, updateField } = useForm()

    return (
      <div>
        {currentStep === 0 && (
          <input
            placeholder="Name"
            onChange={(e) => updateField('name', e.target.value)}
          />
        )}
        <button onClick={nextStep}>Next</button>
      </div>
    )
  }

  render(
    <FormProvider>
      <TestComponent />
    </FormProvider>
  )

  await user.type(screen.getByPlaceholderText('Name'), 'John')
  await user.click(screen.getByRole('button'))

  // Next step should render
})
```

## Best Practices for Multi-Step Forms

### DO:
- Validate at each step before allowing progress
- Preserve form data when navigating backward
- Show clear progress indicators
- Test navigation in both directions
- Test validation for each field
- Test submission with complete data
- Test error states and recovery
- Use semantic HTML for accessibility

### DON'T:
- Clear form data when going back
- Allow invalid data to progress
- Skip validation on review step
- Test implementation details
- Submit without client-side validation
- Forget to test error scenarios
- Ignore accessibility requirements

## Testing Checklist

```typescript
✓ Navigate forward through all steps
✓ Navigate backward and preserve data
✓ Validate required fields at each step
✓ Prevent progress with invalid data
✓ Show validation error messages
✓ Submit form with all data collected
✓ Show loading state during submission
✓ Handle submission errors gracefully
✓ Display success message after submission
✓ Reset form after successful submission
✓ Keyboard navigation (Tab, Enter)
✓ Screen reader accessibility
✓ Progress indicator accuracy
```

## Key References

- **Multi-step Form Example (GitHub)**: https://github.com/ArinzeGit/Multi-step-Form
- **Testing React Hook Form**: https://claritydev.net/blog/testing-react-hook-form-with-react-testing-library/
- **Form Testing Best Practices**: https://testing-library.com/docs/example-react-context/
- **Real-Dev-Squad TDD Practice**: https://github.com/Real-Dev-Squad/react-tests-tdd

## Summary

Test multi-step forms by verifying navigation, validation at each step, data preservation on backward navigation, and proper submission handling. Use context or state management to track progress. Test both success and error paths. Always validate before allowing step progression.
