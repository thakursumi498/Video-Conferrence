const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const Showchat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("showchat");
};

const showInvitePop = () => {
    document.body.classList.add("showInvite");
    document.getElementById("roomLink").value = window.location.href;
};

const hideInvitePopup = () => {
    document.body.classList.remove("showInvite");
};

const copyToClipboard = () => {
    const copyText = document.getElementById("roomLink");
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand("copy");
        alert("Copied: " + copyText.value);
    } catch (err) {
        console.error("Failed to copy: ", err);
    }

    hideInvitePopup(); // Ensure to hide popup after copying
};

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

let myVideoStream;

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");

            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });

        socket.on("createMessage", (msg) => {
            let li = document.createElement("li");
            li.innerHTML = msg;
            all_messages.append(li);
            main__chat__window.scrollTop = main__chat__window.scrollHeight;
        });

        document.addEventListener("keydown", (e) => {
            if (e.which === 13 && chatInputBox.value !== "") {
                socket.emit("message", chatInputBox.value);
                chatInputBox.value = "";
            }
        });
    });

peer.on("call", function (call) {
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream);
            });
        })
        .catch((err) => {
            console.log("Failed to get local stream", err);
        });
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, streams) => {
    var call = peer.call(userId, streams);
    var video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
};

const addVideoStream = (videoEl, stream) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });

    videoGrid.append(videoEl);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i><span class="unmute">Resume Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
    const html = `<i class="fa fa-video-camera"></i><span class="">Pause Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i><span class="unmute">Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i><span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

// Add event listener for "Leave Meeting" button
document.getElementById("leave-meeting").addEventListener("click", () => {
    socket.disconnect(); // Disconnect from the server
    window.location.href = "/"; // Redirect to home or a different page
});

// Add event listener for "Participants" button
document.querySelector('.main__controls_button:nth-child(3)').addEventListener("click", () => {
    socket.emit("request-participants");
});

socket.on("participants", (participants) => {
    console.log("Participants:", participants);
    // Handle the display of participants list (e.g., open a modal or alert)
});
