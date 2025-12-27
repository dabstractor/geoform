import { useState } from 'react';
import type { FormProps } from '../../types';
import { useFormStack } from '../../hooks';

/**
 * Test form with internal state that can be observed.
 * Use inputTestId to find the input and verify its value.
 */
export function StatefulTestForm({
  onSubmit,
  onCancel,
  formId = 'test',
  initialValue = '',
}: FormProps<{ value: string }> & { formId?: string; initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div data-testid={`form-${formId}`}>
      <input
        data-testid={`input-${formId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button data-testid={`submit-${formId}`} onClick={() => onSubmit({ value })}>
        Submit
      </button>
      <button data-testid={`cancel-${formId}`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/**
 * Form that can open a child form and capture its result.
 * Use to test parent-child form interactions.
 */
export function ParentFormWithChild<TChild = unknown>({
  onSubmit,
  onCancel,
  ChildComponent,
  formId = 'parent',
}: FormProps<{ parentValue: string; childResult?: TChild }> & {
  ChildComponent: React.ComponentType<FormProps<TChild>>;
  formId?: string;
}) {
  const { openForm } = useFormStack();
  const [parentValue, setParentValue] = useState('');
  const [childResult, setChildResult] = useState<TChild | undefined>(undefined);

  const handleOpenChild = async () => {
    const result = await openForm({
      id: 'child-form',
      label: 'Child Form',
      component: ChildComponent,
    });
    setChildResult(result);
  };

  return (
    <div data-testid={`form-${formId}`}>
      <input
        data-testid={`input-${formId}`}
        value={parentValue}
        onChange={(e) => setParentValue(e.target.value)}
      />
      <span data-testid={`child-result-${formId}`}>
        {childResult !== undefined ? JSON.stringify(childResult) : 'no-result'}
      </span>
      <button data-testid={`open-child-${formId}`} onClick={handleOpenChild}>
        Open Child
      </button>
      <button
        data-testid={`submit-${formId}`}
        onClick={() => onSubmit({ parentValue, childResult })}
      >
        Submit
      </button>
      <button data-testid={`cancel-${formId}`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/**
 * Error-throwing form for error boundary tests.
 */
export function ErrorThrowingForm({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test form error');
  }
  return <div data-testid="error-form-rendered">Form rendered successfully</div>;
}

/**
 * Simple test form for basic open/submit/cancel workflows.
 */
export function SimpleTestForm({ onSubmit, onCancel }: FormProps<string>) {
  return (
    <div data-testid="simple-form">
      <button data-testid="submit-simple" onClick={() => onSubmit('submitted')}>
        Submit
      </button>
      <button data-testid="cancel-simple" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/**
 * Nestable form that can open another level.
 * Used for deep nesting tests with observable state at each level.
 */
export function NestableForm({
  onSubmit,
  onCancel,
  formId,
  nextFormId,
}: FormProps<{ value: string }> & { formId: string; nextFormId?: string }) {
  const { openForm, stack } = useFormStack();
  const [value, setValue] = useState(`initial-${formId}`);

  const handleOpenNext = async () => {
    if (!nextFormId) return;

    const nextNextId =
      nextFormId === 'level-2' ? 'level-3' : nextFormId === 'level-3' ? undefined : undefined;

    await openForm({
      id: nextFormId,
      label: nextFormId,
      component: (props: FormProps<{ value: string }>) => (
        <NestableForm {...props} formId={nextFormId} nextFormId={nextNextId} />
      ),
    });
  };

  return (
    <div data-testid={`form-${formId}`}>
      <input
        data-testid={`input-${formId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <span data-testid="stack-depth">{stack.length}</span>
      {nextFormId && (
        <button data-testid={`open-next-${formId}`} onClick={handleOpenNext}>
          Open Next
        </button>
      )}
      <button data-testid={`submit-${formId}`} onClick={() => onSubmit({ value })}>
        Submit
      </button>
      <button data-testid={`cancel-${formId}`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
