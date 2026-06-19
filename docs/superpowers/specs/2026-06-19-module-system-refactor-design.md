# Module System Refactor: Drag & Drop + Module Registry

## Summary

Replace the custom HTML5 Drag & Drop implementation in the WeChat article layout editor with `vue-draggable-plus` (already installed), and introduce a module registry pattern to reduce boilerplate when adding new module types.

## Motivation

As module types grew from a handful to 10+ types, two pain points emerged:

1. **Drag & drop complexity** — The custom HTML5 Drag & Drop implementation in `EditorCanvas.vue` requires manual handling of `dragover`/`drop`/`dragleave` events, drop-line positioning, cross-container drag state, and indicator management (~150 lines of drag logic).
2. **Module management boilerplate** — Adding a new module type requires edits to 5+ files: types, ModuleLibrary, ModuleRenderer, PropertyPanel, and the module component itself.

## Design

### 1. Drag & Drop: vue-draggable-plus

Replace the hand-written drag-and-drop in `EditorCanvas.vue` with `<VueDraggable>` from `vue-draggable-plus` (v0.3.0, already in `package.json`).

**Changes:**
- `EditorCanvas.vue`: Wrap module list with `<VueDraggable v-model="rootChildren" ...>`, removing all custom drag event handlers (`onCanvasDragOver`, `onCanvasDrop`, `onDropLineDragOver`, `onDropAtIndex`, etc.)
- `ModuleLibrary.vue` → `EditorCanvas.vue`: Cross-list drag via `group` configuration
- `ModuleItem.vue`: Remove drag handle and `draggable` attribute
- Delete `useDragState` composable (no longer needed)

**vue-draggable-plus provides:**
- Built-in sortable lists with v-model binding
- Cross-list drag via group config
- Ghost class for drop indicators (replaces custom drop-line CSS)
- Drag handle support if needed
- Touch/mobile support

### 2. Module Registry Pattern

Create a centralized registry at `src/registry/modules.ts` that defines all module types in one place:

```typescript
interface ModuleRegistration {
  type: ModuleType
  name: string
  group: string
  icon: string
  description: string
  component: () => Promise<Component>
  defaultProps: Record<string, any>
  defaultStyles: ModuleStyles
  propertyPanel?: () => Promise<Component>
  variants?: { name: string; variant: string; description: string; icon: string }[]
}
```

**Consumers of the registry:**

| Consumer | Current | After |
|----------|---------|-------|
| ModuleLibrary | Hardcoded list of 20+ items | Auto-generated from registry, grouped by group field |
| ModuleRenderer | Explicit import + map of 10 components | Dynamic `component :is` from registry |
| PropertyPanel | One giant component with v-if for each type | Per-type property panel components loaded from registry |
| createModule() | switch statement with 10 cases | Lookup defaultProps from registry |

### 3. PropertyPanel Decomposition

Current PropertyPanel is ~770 lines with v-if sections for each module type. Decompose into per-module property editor components:

- `modules/TextProperty.vue`
- `modules/ImageProperty.vue`
- `modules/ButtonProperty.vue`
- etc.

PropertyPanel becomes a thin container that looks up the registered property component for the selected module type.

## Migration Path

4 independent steps, each can be done separately:

| Step | What | Files Changed |
|------|------|---------------|
| 1 | Replace EditorCanvas drag with vue-draggable-plus | EditorCanvas.vue, ModuleItem.vue, useDragState.ts |
| 2 | Create module registry, update ModuleLibrary + ModuleRenderer | registry/modules.ts, ModuleLibrary.vue, ModuleRenderer.vue |
| 3 | Split PropertyPanel into per-module editors | PropertyPanel.vue, new per-type property components |
| 4 | Cleanup | Remove useDragState, unused imports, old styles |

## Things That Stay The Same

- Pinia store (`documentStore`) — no changes
- Module Vue components rendering — no changes
- Document data types (`Document`, `Module` interfaces) — no changes
- Export HTML flow — no changes
- PreviewCanvas — no changes
- AI Chat Dialog — no changes

## Test Plan

1. Drag module from library to canvas at specific position
2. Reorder modules within canvas by dragging
3. Click-add module from library
4. Select, edit properties, delete modules
5. Undo/redo after drag operations
6. Verify all 10 module types render correctly
7. Verify export HTML still produces correct output
