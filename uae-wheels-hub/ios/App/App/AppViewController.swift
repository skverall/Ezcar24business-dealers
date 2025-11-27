import UIKit
import Capacitor
import WebKit

// Custom bridge controller to enable iOS-native gestures and behaviors
class AppViewController: CAPBridgeViewController, UIGestureRecognizerDelegate {
    private var refreshControl: UIRefreshControl?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Enable Safari-like back/forward gestures inside WKWebView
        self.webView?.allowsBackForwardNavigationGestures = true

        // Make the web view feel native
        if let scrollView = self.webView?.scrollView {
            // Tap status bar -> scroll to top (works when only one scroll view has this enabled)
            scrollView.scrollsToTop = true
            // Use safe-area insets automatically
            scrollView.contentInsetAdjustmentBehavior = .automatic
            // iOS-style bounce
            scrollView.bounces = true
            // Dismiss keyboard when dragging the content
            scrollView.keyboardDismissMode = .onDrag

            // Pull to refresh (reload SPA)
            let r = UIRefreshControl()
            r.addTarget(self, action: #selector(handleRefresh(_:)), for: .valueChanged)
            scrollView.refreshControl = r
            self.refreshControl = r
        }
    }

    @objc private func handleRefresh(_ sender: UIRefreshControl) {
        // Reload the web view content; this will refresh the SPA
        self.webView?.reload()
        // End refreshing after a short delay to allow reload kick off
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            sender.endRefreshing()
        }
    }

    // Match the StatusBar plugin style
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
}

