import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let width = 1024
let height = 1024
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: bitmapInfo) else {
    fatalError("Unable to create CGContext")
}

let rect = CGRect(x: 0, y: 0, width: width, height: height)

// Background gradient
let colors: [CGColor] = [
    CGColor(red: 0.06, green: 0.52, blue: 1.00, alpha: 1.0),
    CGColor(red: 0.31, green: 0.78, blue: 1.00, alpha: 1.0)
]
let locations: [CGFloat] = [0.0, 1.0]
let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: locations)!
ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: 0), end: CGPoint(x: CGFloat(width), y: CGFloat(height)), options: [])

// Inner ring
ctx.setLineWidth(24)
ctx.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.12))
ctx.stroke(rect.insetBy(dx: 12, dy: 12))

// Wordmark "EZ24" using CoreText
let fontSize: CGFloat = 420
let font = CTFontCreateWithName("HelveticaNeue-Black" as CFString, fontSize, nil)
let attributes: [NSAttributedString.Key: Any] = [
    NSAttributedString.Key(kCTFontAttributeName as String): font,
    NSAttributedString.Key(kCTForegroundColorAttributeName as String): CGColor(gray: 1.0, alpha: 1.0),
    NSAttributedString.Key(kCTKernAttributeName as String): -8
]
let text = NSAttributedString(string: "EZ24", attributes: attributes)
let line = CTLineCreateWithAttributedString(text)
var ascent: CGFloat = 0
var descent: CGFloat = 0
var leading: CGFloat = 0
let lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
let lineHeight = ascent + descent
let textX = (CGFloat(width) - lineWidth) / 2
let textY = (CGFloat(height) - lineHeight) / 2 - 24

ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: -6), blur: 28, color: CGColor(gray: 0, alpha: 0.28))
ctx.textPosition = CGPoint(x: textX, y: textY + descent)
CTLineDraw(line, ctx)
ctx.restoreGState()

// Export PNG
guard let image = ctx.makeImage() else { fatalError("makeImage failed") }
let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("Ezcar24Business/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png")

guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    fatalError("Failed to create image destination")
}
CGImageDestinationAddImage(dest, image, nil)
if CGImageDestinationFinalize(dest) {
    print("Wrote icon to \(url.path)")
} else {
    fatalError("Failed to finalize PNG")
}

