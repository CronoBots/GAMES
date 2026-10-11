import Capacitor
import GameKit

/// Succès d'Orbicube dans Game Center.
/// connecter : identifie le joueur (Apple affiche sa fenêtre la première fois) ;
/// debloquer : déclare un succès gagné (sans effet s'il l'est déjà) ;
/// afficher : ouvre la liste des succès de Game Center.
@objc(SuccesNatifsPlugin)
public class SuccesNatifsPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "SuccesNatifsPlugin"
    public let jsName = "SuccesNatifs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connecter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "debloquer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "afficher", returnType: CAPPluginReturnPromise)
    ]
    private var appelsEnAttente: [CAPPluginCall] = []

    @objc public func connecter(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if GKLocalPlayer.local.isAuthenticated {
                call.resolve(["connecte": true])
                return
            }
            self.appelsEnAttente.append(call)
            // Game Center rappelle ce gestionnaire à chaque changement d'état : on répond une fois à chaque appel en attente
            GKLocalPlayer.local.authenticateHandler = { [weak self] fenetre, _ in
                guard let self = self else { return }
                if let fenetre = fenetre {
                    self.bridge?.viewController?.present(fenetre, animated: true)
                    return
                }
                let connecte = GKLocalPlayer.local.isAuthenticated
                let appels = self.appelsEnAttente
                self.appelsEnAttente.removeAll()
                appels.forEach { $0.resolve(["connecte": connecte]) }
            }
        }
    }

    @objc public func debloquer(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), !id.isEmpty else {
            call.reject("identifiant de succès manquant")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("joueur non connecté à Game Center")
            return
        }
        let succes = GKAchievement(identifier: id)
        succes.percentComplete = 100
        succes.showsCompletionBanner = true
        GKAchievement.report([succes]) { erreur in
            if let erreur = erreur {
                call.reject(erreur.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }

    @objc public func afficher(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let vue = GKGameCenterViewController(state: .achievements)
            vue.gameCenterDelegate = self
            self.bridge?.viewController?.present(vue, animated: true)
            call.resolve()
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
