# Accessibility Implementation

This document outlines the accessibility features and best practices implemented in the application to ensure it's usable by everyone, including people with disabilities.

## Key Accessibility Features

### 1. Keyboard Navigation
- Full keyboard navigation support
- Logical tab order
- Visual focus indicators
- Skip links for bypassing repetitive content

### 2. Screen Reader Support
- ARIA attributes for dynamic content
- Live regions for announcements
- Proper heading structure
- Semantic HTML elements

### 3. Focus Management
- Programmatic focus management
- Focus trapping for modals and dialogs
- Focus restoration after interactions

### 4. Color and Contrast
- Sufficient color contrast ratios
- Color-independent information
- Dark/light mode support

## Using the Accessibility Utilities

### Focus Management

```typescript
import { focusFirstFocusable, focusLastFocusable, trapFocus } from '@/lib/accessibility';

// Focus the first focusable element in a container
focusFirstFocusable(containerElement);

// Focus the last focusable element in a container
focusLastFocusable(containerElement);

// Trap focus within a modal/dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close modal logic
  }
});
```

### ARIA Live Regions

```typescript
import { announce } from '@/lib/accessibility';

// Announce a message to screen readers
announce('Form submitted successfully', 'polite');
```

### Skip Links

Skip links are automatically added to the page. Add an `id="main-content"` to your main content area:

```html
<main id="main-content">
  <!-- Main content here -->
</main>
```

## Testing Accessibility

### Automated Testing

1. **Lighthouse** - Run Lighthouse in Chrome DevTools to check for accessibility issues
2. **axe DevTools** - Browser extension for accessibility testing
3. **WAVE** - Web Accessibility Evaluation Tool

### Manual Testing

1. **Keyboard Navigation**
   - Navigate using only the Tab key
   - Ensure all interactive elements are reachable
   - Check that focus order is logical

2. **Screen Reader Testing**
   - Test with VoiceOver (Safari/Mac)
   - Test with NVDA (Firefox/Windows)
   - Test with JAWS (Chrome/Windows)

3. **Color Contrast**
   - Verify text has sufficient contrast (4.5:1 for normal text)
   - Check that color is not the only means of conveying information

## Common Patterns

### Accessible Buttons

```tsx
<button 
  type="button"
  onClick={handleClick}
  aria-label="Close dialog"
  className="close-button"
>
  <span aria-hidden="true">&times;</span>
</button>
```

### Accessible Forms

```tsx
<>
  <label htmlFor="username">Username</label>
  <input
    id="username"
    type="text"
    aria-describedby="username-help"
    required
  />
  <p id="username-help">Enter your username or email address</p>
</>
```

### Accessible Dialogs

```tsx
<div 
  role="dialog" 
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  tabIndex={-1}
>
  <h2 id="dialog-title">Confirmation</h2>
  <p id="dialog-description">Are you sure you want to delete this item?</p>
  
  <div className="dialog-actions">
    <button onClick={handleCancel}>Cancel</button>
    <button onClick={handleConfirm}>Delete</button>
  </div>
</div>
```

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)
