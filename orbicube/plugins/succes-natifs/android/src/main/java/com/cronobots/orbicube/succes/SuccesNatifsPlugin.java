package com.cronobots.orbicube.succes;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.AchievementsClient;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;

/**
 * Succès d'Orbicube dans Google Play Jeux.
 * connecter : identifie le joueur (connexion automatique, ou fenêtre de Google la première fois) ;
 * debloquer : déclare un succès gagné (sans effet s'il l'est déjà) ;
 * afficher : ouvre la liste des succès de Google Play Jeux.
 * Tant que l'identifiant du projet n'est pas fourni, rien n'est appelé : le jeu garde ses succès locaux.
 */
@CapacitorPlugin(name = "SuccesNatifs")
public class SuccesNatifsPlugin extends Plugin {

    private static final int DEMANDE_SUCCES = 9003;
    private boolean pret = false;

    @Override
    public void load() {
        int ressource = getContext().getResources().getIdentifier("game_services_project_id", "string", getContext().getPackageName());
        String id = ressource == 0 ? "" : getContext().getString(ressource);
        if (id != null && !id.trim().isEmpty()) {
            PlayGamesSdk.initialize(getContext());
            pret = true;
        }
    }

    @PluginMethod
    public void connecter(PluginCall call) {
        if (!pret || getActivity() == null) {
            JSObject r = new JSObject();
            r.put("connecte", false);
            call.resolve(r);
            return;
        }
        GamesSignInClient client = PlayGames.getGamesSignInClient(getActivity());
        client.isAuthenticated().addOnCompleteListener(etat -> {
            if (etat.isSuccessful() && etat.getResult().isAuthenticated()) {
                JSObject r = new JSObject();
                r.put("connecte", true);
                call.resolve(r);
                return;
            }
            client.signIn().addOnCompleteListener(connexion -> {
                JSObject r = new JSObject();
                r.put("connecte", connexion.isSuccessful() && connexion.getResult().isAuthenticated());
                call.resolve(r);
            });
        });
    }

    @PluginMethod
    public void debloquer(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("identifiant de succès manquant");
            return;
        }
        if (!pret || getActivity() == null) {
            call.reject("Google Play Jeux n'est pas configuré");
            return;
        }
        PlayGames.getAchievementsClient(getActivity()).unlock(id);
        call.resolve();
    }

    @PluginMethod
    public void afficher(PluginCall call) {
        if (!pret || getActivity() == null) {
            call.reject("Google Play Jeux n'est pas configuré");
            return;
        }
        AchievementsClient succes = PlayGames.getAchievementsClient(getActivity());
        succes.getAchievementsIntent()
            .addOnSuccessListener(intention -> {
                getActivity().startActivityForResult(intention, DEMANDE_SUCCES);
                call.resolve();
            })
            .addOnFailureListener(erreur -> call.reject(erreur.getMessage()));
    }
}
