/*
 * The desktop client loads these shared modules through its native adapter
 * layer. Keep their runtime exports in the client bundle even when the web
 * application only references some of them as TypeScript types.
 *
 * Webpack is otherwise allowed to tree-shake an abstract class such as
 * AbstractServerConnection, leaving the native renderer with an undefined
 * base class when it loads the remote UI package.
 */
import * as abstractCommandHandler from "tc-shared/connection/AbstractCommandHandler";
import * as commandHandler from "tc-shared/connection/CommandHandler";
import * as connectionBase from "tc-shared/connection/ConnectionBase";
import * as connectionFactory from "tc-shared/connection/ConnectionFactory";
import * as handshakeHandler from "tc-shared/connection/HandshakeHandler";
import * as serverConnectionDeclaration from "tc-shared/connection/ServerConnectionDeclaration";
import * as videoConnection from "tc-shared/connection/VideoConnection";
import * as voiceConnection from "tc-shared/connection/VoiceConnection";
import * as rtcConnection from "tc-shared/connection/rtc/Connection";
import * as rtcVideoConnection from "tc-shared/connection/rtc/video/Connection";
import * as pptListener from "tc-shared/PPTListener";
import * as recorder from "tc-shared/audio/Recorder";
import * as mediaStream from "tc-shared/media/Stream";
import * as mediaVideo from "tc-shared/media/Video";
import * as transfer from "tc-shared/file/Transfer";
import * as recorderBase from "tc-shared/voice/RecorderBase";
import * as recorderProfile from "tc-shared/voice/RecorderProfile";
import * as voicePlayer from "tc-shared/voice/VoicePlayer";

/* A live object reference prevents export-level tree shaking. */
(window as any).__native_client_shared_runtime = {
    abstractCommandHandler,
    commandHandler,
    connectionBase,
    connectionFactory,
    handshakeHandler,
    serverConnectionDeclaration,
    videoConnection,
    voiceConnection,
    rtcConnection,
    rtcVideoConnection,
    pptListener,
    recorder,
    mediaStream,
    mediaVideo,
    transfer,
    recorderBase,
    recorderProfile,
    voicePlayer
};
