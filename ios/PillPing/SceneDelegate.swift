import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {

    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    let appDelegate = UIApplication.shared.delegate as! AppDelegate

    guard let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)

    factory.startReactNative(
      withModuleName: "PillPing",
      in: window,
      launchOptions: nil
    )

    self.window = window
  }
}
