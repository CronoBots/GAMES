import Capacitor
import GameKit

/// Succès d'Orbicube dans Game Center.
/// connecter : identifie le joueur (Apple affiche sa fenêtre la première fois) ;
/// debloquer : déclare un succès gagné (sans effet s'il l'est déjà) ;
/// afficher : ouvre la liste des succès de Game Center ;
/// envoyerScore : envoie un score à un classement (un chrono arrive en millisecondes : Game Center compte en centièmes) ;
/// afficherClassements : ouvre un classement, ou la liste des classements sans identifiant.
@objc(SuccesNatifsPlugin)
public class SuccesNatifsPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "SuccesNatifsPlugin"
    public let jsName = "SuccesNatifs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connecter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "debloquer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "afficher", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "envoyerScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "afficherClassements", returnType: CAPPluginReturnPromise)
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

    @objc public func envoyerScore(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), !id.isEmpty else {
            call.reject("identifiant de classement manquant")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("joueur non connecté à Game Center")
            return
        }
        let valeur = call.getInt("valeur") ?? 0
        let score = call.getBool("temps") ?? false ? valeur / 10 : valeur
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [id]) { erreur in
            if let erreur = erreur {
                call.reject(erreur.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }

    @objc public func afficherClassements(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        DispatchQueue.main.async {
            let vue = id.isEmpty
                ? GKGameCenterViewController(state: .leaderboards)
                : GKGameCenterViewController(leaderboardID: id, playerScope: .global, timeScope: .allTime)
            vue.gameCenterDelegate = self
            self.bridge?.viewController?.present(vue, animated: true)
            call.resolve()
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
