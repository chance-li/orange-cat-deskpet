import { nativeImage, type NativeImage } from 'electron'

/** Original 32×32 orange tabby face, embedded so the tray icon always loads. */
const TRAY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACNUlEQVR42u1XS04CQRDlAK6MCxccwIQ/GqPGM3gGF3IHwygg+IlGE2OIXsAFB/EO/H9qDGLcsW/71XQ1AwwGp4cYEjqpUOmuqvequrqnCQSWYzlcxsthUPx7TDj4QcRzHDgNSs9GJIxjwJkDOINU0iFRsSBhJVKXc+NZs3/ANAMWAFVPwqJ2GhG1TETUlUDHHNZg4/Qx2kYmgOwIGIDZqGjkYqJ5FhOlgzUS6JjDGmyISDpkToDLjYD1jALOxwm0fZ7QBFjHGhGRtkzC+PgwOLJsFeKio8C6V5uaAOtYgw1smYRZ9pZddmRF4BdJDfp+s+Wqwwa28IEvYngCL8vyobEacl9beYAnxKvM9O3aBvu429agrGMNNrCFD3wRo+xlK9DNyADlbBcSonuZFM7Ru9/RBKA7B2zhA1+7Ch4IVK3h3iMjHvHgKv32H3bFV3GPBLpzDQM+uhe8bAM1ny5/UgOwYHw/7ZO4rVEvSF/E8NSMTgKfxZQriBh0bHFZg4+PBI5E/zE1WmYGHyNB2yNt4WNEoEI9oJpQnm+c9XHQ3vEtyfg8bOFj94DHo1jhY8h3AE7BjARgq+8CGcPzjcjbwFWYKPsU0dlnDW/DYRXsXpiFBGzoEspFzbIfuY4ViWYel1J8Oji+A/nYENwK+/O0qyoSvB346mGPnYI5Lju9DfwCd17NI28CehcokfrIW8AK+f6onSCiX0bqJTQ34I31leQ0wVcO8pvN3MD/IotLwJTIQvwN/AEfL/n8lZkWmwAAAABJRU5ErkJggg=='

export function createTrayIcon(): NativeImage {
  const image = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_PNG_BASE64}`)
  if (!image.isEmpty()) {
    return image
  }
  return nativeImage.createEmpty()
}
