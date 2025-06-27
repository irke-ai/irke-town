# PIXI Graphics Interaction Issue - Diagnosis and Solution

## Problem Diagnosis

You're experiencing pointer event issues with Graphics objects in @pixi/react because of a **version incompatibility**:

- **@pixi/react**: 7.1.2
- **pixi.js**: 8.5.0

**These versions are incompatible!** @pixi/react v7 was designed for pixi.js v7, not v8.

## Root Cause

1. **Major API Changes**: pixi.js v8 introduced significant breaking changes that @pixi/react v7 cannot handle
2. **Event System Overhaul**: v8 replaced the InteractionManager with a new FederatedEvents system
3. **Graphics API Changes**: The way Graphics objects handle interactions changed significantly

## Solutions

### Option 1: Downgrade pixi.js (Recommended for Quick Fix)

```bash
npm uninstall pixi.js
npm install pixi.js@7.2.4
```

This will restore compatibility with @pixi/react 7.1.2 and your Graphics interactions should work with:

```tsx
<Graphics 
  draw={draw} 
  interactive={true}
  pointerdown={handleClick}
  cursor="pointer"
/>
```

### Option 2: Upgrade to @pixi/react v8 (Recommended for Long Term)

**Note**: @pixi/react v8 requires React 19 and is still in development.

```bash
npm install @pixi/react@next pixi.js@8.5.0
```

Then update your code to use the new v8 API:

```tsx
import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'

// Register Graphics component
extend({ Graphics })

// In your component
const drawCallback = useCallback((g) => {
  g.clear()
  // ... your drawing code ...
  
  // Set interaction in the draw callback
  g.eventMode = 'static'
  g.cursor = 'pointer'
  
  g.on('pointerdown', handleClick)
}, [])

return <pixiGraphics draw={drawCallback} />
```

### Option 3: Working Solution for Current Setup (Workaround)

If you must keep the current versions, here's a workaround that adds interaction to the Container level:

```tsx
function BuildingGraphics({ building, isSelected, onSelect }) {
  const handleClick = useCallback((e) => {
    console.log('Building clicked:', building.id)
    e.stopPropagation()
    onSelect()
  }, [building.id, onSelect])

  const draw = useCallback((g) => {
    g.clear()
    // ... your drawing code ...
  }, [building, isSelected, statusColor])
  
  // Create a hit area
  const hitArea = useMemo(() => {
    const topLeft = gridToScreen(building.gridX, building.gridY)
    const topRight = gridToScreen(building.gridX + building.width, building.gridY)
    const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
    const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
    
    return new PIXI.Polygon([
      topLeft.x, topLeft.y,
      topRight.x, topRight.y,
      bottomRight.x, bottomRight.y,
      bottomLeft.x, bottomLeft.y
    ])
  }, [building])
  
  return (
    <Container
      interactive={true}
      hitArea={hitArea}
      pointerdown={handleClick}
      cursor="pointer"
    >
      <Graphics draw={draw} />
      {/* Text elements */}
    </Container>
  )
}
```

## Verification Steps

1. Check console for deprecation warnings
2. Verify event handlers are being called with console.log
3. Use PIXI DevTools browser extension to inspect the scene graph
4. Check if Graphics objects have proper bounds/hitArea

## Best Practices

1. **Always match major versions**: @pixi/react v7 with pixi.js v7, v8 with v8
2. **Set eventMode explicitly**: In v8, use `eventMode="static"` instead of `interactive={true}`
3. **Define hitArea**: For complex shapes, explicitly define the hit area
4. **Check z-order**: Ensure interactive elements aren't covered by other elements

## Recommended Action

For your current project, I recommend **Option 1 (downgrade pixi.js to 7.2.4)** as it will:
- Immediately fix your interaction issues
- Require no code changes
- Maintain stability with your existing @pixi/react 7.1.2

Once @pixi/react v8 is stable and you're ready to upgrade to React 19, then migrate to the v8 ecosystem.