import $ from "jquery";
import {ConnectionHandler} from "tc-shared/ConnectionHandler";
import {RegistryKey} from "tc-shared/settings";
import {createErrorModal, createInputModal, createModal} from "tc-shared/ui/elements/Modal";
import {tr} from "tc-shared/i18n/localize";
import {CommandResult} from "tc-shared/connection/ServerConnectionDeclaration";
import {WhisperTargetChannelClients} from "tc-shared/voice/VoiceWhisper";

const cssStyle = require("./ModalWhisperList.scss");

interface WhisperList {
    name: string;
    channels: number[];
    clients: string[];
}

const KEY_WHISPER_LISTS: RegistryKey<WhisperList[]> = {
    key: "whisper_lists",
    valueType: "object",
};

function normalizeLists(value: unknown): WhisperList[] {
    if(!Array.isArray(value)) {
        return [{ name: tr("Default"), channels: [], clients: [] }];
    }

    const result = value.map((entry: any) => ({
        name: typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim() : tr("Whisper List"),
        channels: Array.isArray(entry?.channels) ? entry.channels.filter(channel => Number.isInteger(channel)) : [],
        clients: Array.isArray(entry?.clients) ? entry.clients.filter(client => typeof client === "string" && client.length > 0) : []
    }));

    return result.length > 0 ? result : [{ name: tr("Default"), channels: [], clients: [] }];
}

function showWhisperError(error: unknown) {
    let message: string;
    if(error instanceof CommandResult) {
        message = error.formattedMessage();
    } else if(error instanceof Error) {
        message = error.message;
    } else {
        message = String(error);
    }
    createErrorModal(tr("Failed to start whisper"), message).open();
}

/** TeamSpeak-style local Whisper List manager. */
export function spawnWhisperList(connection: ConnectionHandler) {
    if(!connection?.connected) {
        return;
    }

    let lists = normalizeLists(connection.settings.getValue(KEY_WHISPER_LISTS, []));
    let activeIndex = 0;
    let whisperActive = false;
    let whisperStarting = false;

    const modal = createModal({
        header: tr("Whisper Lists"),
        width: 720,
        min_width: 560,
        footer: undefined,
        body: () => $("<div>").addClass(cssStyle.modal)
    });
    const root = modal.htmlTag.find("." + cssStyle.modal);

    const save = () => connection.settings.setValue(KEY_WHISPER_LISTS, lists);
    const activeList = () => lists[activeIndex];

    const setStatus = (message: string, error = false) => {
        root.find("." + cssStyle.status).text(message).toggleClass(cssStyle.error, error);
    };

    const stopWhisper = () => {
        if(!whisperActive && !whisperStarting) {
            return;
        }
        whisperStarting = false;
        whisperActive = false;
        connection.getServerConnection().getVoiceConnection().stopWhisper();
        root.find("." + cssStyle.stop).prop("disabled", true);
        setStatus(tr("Whisper stopped"));
    };

    const startWhisper = () => {
        if(whisperStarting || whisperActive) {
            return;
        }

        const list = activeList();
        const target: WhisperTargetChannelClients = {
            target: "channel-clients",
            channels: [...list.channels],
            clients: [...list.clients]
        };

        if(target.channels.length === 0 && target.clients.length === 0) {
            setStatus(tr("Select at least one channel or client"), true);
            return;
        }

        whisperStarting = true;
        setStatus(tr("Starting whisper..."));
        connection.getServerConnection().getVoiceConnection().startWhisper(target).then(() => {
            whisperStarting = false;
            whisperActive = true;
            root.find("." + cssStyle.stop).prop("disabled", false);
            setStatus(tr("Whisper active") + ": " + list.name);
        }).catch(error => {
            whisperStarting = false;
            whisperActive = false;
            root.find("." + cssStyle.stop).prop("disabled", true);
            setStatus(tr("Whisper failed"), true);
            showWhisperError(error);
        });
    };

    const render = () => {
        const list = activeList();
        root.empty();

        const toolbar = $("<div>").addClass(cssStyle.toolbar);
        const selector = $("<select>").addClass(cssStyle.selector);
        lists.forEach((entry, index) => $("<option>").val(index).text(entry.name).appendTo(selector));
        selector.val(activeIndex).on("change", () => {
            stopWhisper();
            activeIndex = parseInt(String(selector.val()), 10) || 0;
            render();
        });
        toolbar.append($("<label>").text(tr("List:")).append(selector));

        $("<button>").text(tr("New")).on("click", () => {
            createInputModal(tr("New Whisper List"), tr("Enter a name for the whisper list:"), value => value.trim().length > 0, value => {
                if(typeof value !== "string") return;
                lists.push({ name: value.trim(), channels: [], clients: [] });
                activeIndex = lists.length - 1;
                save();
                render();
            }).open();
        }).appendTo(toolbar);

        $("<button>").text(tr("Rename")).on("click", () => {
            createInputModal(tr("Rename Whisper List"), tr("Enter a new name for the whisper list:"), value => value.trim().length > 0, value => {
                if(typeof value !== "string") return;
                activeList().name = value.trim();
                save();
                render();
            }, { defaultValue: list.name }).open();
        }).appendTo(toolbar);

        $("<button>").text(tr("Delete")).prop("disabled", lists.length <= 1).on("click", () => {
            if(lists.length <= 1) return;
            stopWhisper();
            lists.splice(activeIndex, 1);
            activeIndex = Math.min(activeIndex, lists.length - 1);
            save();
            render();
        }).appendTo(toolbar);
        root.append(toolbar);

        const description = $("<p>").addClass(cssStyle.description).text(tr("Select channels and clients that should receive your voice. The server still applies its Whisper permissions."));
        root.append(description);

        const targets = $("<div>").addClass(cssStyle.targets);
        const channels = $("<div>").addClass(cssStyle.targetColumn).append($("<h3>").text(tr("Channels")));
        connection.channelTree.channelsOrdered().forEach(channel => {
            const checked = list.channels.indexOf(channel.channelId) !== -1;
            const row = $("<label>").addClass(cssStyle.target);
            $("<input type='checkbox'>").prop("checked", checked).on("change", event => {
                if((event.target as HTMLInputElement).checked) {
                    if(list.channels.indexOf(channel.channelId) === -1) list.channels.push(channel.channelId);
                } else {
                    list.channels = list.channels.filter(id => id !== channel.channelId);
                }
                save();
            }).appendTo(row);
            $("<span>").text("  ".repeat(channel.channelDepth()) + channel.formattedChannelName()).appendTo(row);
            channels.append(row);
        });

        const clients = $("<div>").addClass(cssStyle.targetColumn).append($("<h3>").text(tr("Clients")));
        connection.channelTree.clients
            .filter(client => client.clientId() !== connection.getClientId() && !!client.clientUid())
            .sort((a, b) => a.clientNickName().localeCompare(b.clientNickName()))
            .forEach(client => {
                const uniqueId = client.clientUid();
                const checked = list.clients.indexOf(uniqueId) !== -1;
                const row = $("<label>").addClass(cssStyle.target);
                $("<input type='checkbox'>").prop("checked", checked).on("change", event => {
                    if((event.target as HTMLInputElement).checked) {
                        if(list.clients.indexOf(uniqueId) === -1) list.clients.push(uniqueId);
                    } else {
                        list.clients = list.clients.filter(id => id !== uniqueId);
                    }
                    save();
                }).appendTo(row);
                const channelName = client.currentChannel()?.formattedChannelName() || tr("Unknown channel");
                $("<span>").text(client.clientNickName() + " — " + channelName).appendTo(row);
                clients.append(row);
            });

        targets.append(channels, clients);
        root.append(targets);

        const actions = $("<div>").addClass(cssStyle.actions);
        $("<button>").addClass(cssStyle.start).text(tr("Start Whisper")).on("click", startWhisper).appendTo(actions);
        $("<button>").addClass(cssStyle.stop).text(tr("Stop Whisper")).prop("disabled", !whisperActive).on("click", stopWhisper).appendTo(actions);
        $("<span>").addClass(cssStyle.status).appendTo(actions);
        root.append(actions);
    };

    modal.close_listener.push(stopWhisper);
    render();
    modal.open();
}
