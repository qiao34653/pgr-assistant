/**
 * 更新
 * @param {boolean} show_update_dialog
 */
var language = require("./theme.js").language.update;
var base_url = "https://gitee.com/q0314/pgr-assistant/raw/master/"

update(true)
function update(show_update_dialog) {
    let cancel = false;
    let dialog = dialogs.build({
        content: language["wait_get_update_info"],
        positive: language["cancel"]
    }).on("positive", () => {
        cancel = true;
    });
    dialog.setCancelable(false);
    if (show_update_dialog) {
        dialog.show();
    }
    http.get(base_url + "last_version_info.json", {}, (res, err) => {
        log(base_url + "last_version_info.json")
        if (!cancel) {
            if (err || res["statusCode"] != 200) {
                if (show_update_dialog) {
                    dialog.setContent(language["update_info_get_fail_alert_dialog_message"]);
                    dialog.setActionButton("positive", language["confirm"]);
                    dialog.setCancelable(true);
                }
            } else {
                let local_config = JSON.parse(files.read("project.json"));
                let last_version_info = res.body.json();
                dialog.setContent(language["versions_info"].replace("%current_versions_name%", local_config["versionName"]).replace("%current_versions_code%", local_config["versionCode"]).replace("%last_versions_name%", last_version_info["version_name"]).replace("%last_versions_code%", last_version_info["version_code"]).replace("%update_content%", last_version_info["update_content"]));
                dialog.setActionButton("neutral", language["show_history_update_info"]);
                dialog.on("neutral", () => {
                    showHistoryUpdateInfo(last_version_info["version_code"] > local_config["versionCode"]);
                });
                console.info(last_version_info["version_code"])
                log(local_config["versionCode"])
                if (last_version_info["version_code"] > local_config["versionCode"]) {
                    dialog.setActionButton("positive", language["update"]);
                    dialog.setActionButton("negative", language["cancel"]);
                    dialog.on("positive", () => {
                        downloadFile();
                    });
                    if (!show_update_dialog) {
                        dialog.show();
                    }
                } else if (show_update_dialog) {
                    dialog.setActionButton("positive", language["confirm"]);
                    dialog.setCancelable(true);
                }
            }
        }
    });
}

/**
 * 历史更新
 * @param {boolean} show_update_button
 */
function showHistoryUpdateInfo(show_update_button) {
    let cancel = false;
    let dialog = dialogs.build({
        content: language["wait_get_history_update_info"],
        positive: language["cancel"]
    }).on("positive", () => {
        cancel = true;
    });
    dialog.setCancelable(false);
    dialog.show();
    http.get(base_url + "history_update_info.txt", {}, (res, err) => {
        if (!cancel) {
            if (err || res["statusCode"] != 200) {
                dialog.setContent(language["history_update_info_get_fail_alert_dialog_message"]);
                dialog.setCancelable(true);
            } else {
                dialog.setContent(res.body.string());
                if (show_update_button) {
                    dialog.setActionButton("neutral", language["cancel"]);
                    dialog.setActionButton("positive", language["update"]);
                    dialog.on("positive", () => {
                        downloadFile();
                    });
                } else {
                    dialog.setActionButton("positive", language["confirm"]);
                    dialog.setCancelable(true);
                }
            }
        }
    });
}

function downloadFile() {
    let cancel = false;
    let dialog = dialogs.build({
        progress: {
            max: 100,
            showMinMax: true
        },
        positive: language["cancel"],
        cancelable: false
    }).on("positive", () => {
        cancel = true;
    }).show();
    let path = files.path("./") + "/";
    let r = http.get(base_url + 'pgr-assistant.zip', {}, (res, err) => {
        try {
            if (!cancel) {
                if (err || res["statusCode"] != 200) {
                    dialog.dismiss();
                    toast(language["update_fail"]);
                } else {
                    files.ensureDir(path + 'pgr-assistant.zip');
                    files.writeBytes(path + 'pgr-assistant.zip', r.body.bytes());
                    files.removeDir(path + 'pgr-assistant.zip');
                    $zip.unzip(path + 'pgr-assistant.zip', path);

                    //files.remove(path + '/assttyys_ng.zip');


                    engines.execScriptFile(path + 'main.js', {
                        path: path
                    });
                    exit();
                }
            }
        } catch (e) {
            dialog.dismiss();
            toast(language["update_fail"]);
        }
    })
   
}