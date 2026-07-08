const SUPABASE_URL = "https://phlfqvfvqzfocsvzmsiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGZxdmZ2cXpmb2Nzdnptc2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDcwNzksImV4cCI6MjA5ODk4MzA3OX0.VmpxumqUS5ZAGVdRInSfx6ykeLh_fXEabDt-azMbmSM";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let setupData = { avatarType: null, avatarValue: null, avatarUrl: null, displayName: null, userId: null };

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const messageDiv = document.getElementById("message");
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const profileSetup = document.getElementById("profileSetup");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");
const userUidMini = document.getElementById("userUidMini");
const menuAvatar = document.getElementById("menuAvatar");
const menuUserName = document.getElementById("menuUserName");
const menuUserEmail = document.getElementById("menuUserEmail");
const chatBox = document.getElementById("chatBox");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const editUsername = document.getElementById("editUsername");

function showMessage(text, type) {
    if (!messageDiv) { alert(text); return; }
    messageDiv.textContent = text;
    messageDiv.className = "show " + (type || "info");
    if (type === "success") { setTimeout(function () { messageDiv.className = ""; }, 5000); }
}

function loadUserProfile(user) {
    const name = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    userName.textContent = name;
    userEmail.value = user.email;
    userUidMini.textContent = "ID: " + (user.id || "").substring(0, 8) + "...";
    if (menuAvatar) menuAvatar.textContent = (name[0] || "S").toUpperCase();
    if (menuUserName) menuUserName.textContent = name;
    if (menuUserEmail) menuUserEmail.textContent = user.email;
    if (editUsername) editUsername.value = name;
    supabaseClient.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle().then(function(result) {
        if (result.data && result.data.avatar_url) {
            if (result.data.avatar_url.startsWith("http")) {
                userAvatar.style.backgroundImage = "url('" + result.data.avatar_url + "')";
                userAvatar.innerHTML = "";
                if (menuAvatar) { menuAvatar.style.backgroundImage = "url('" + result.data.avatar_url + "')"; menuAvatar.innerHTML = ""; }
            } else {
                userAvatar.textContent = result.data.avatar_url;
                if (menuAvatar) menuAvatar.textContent = result.data.avatar_url;
            }
        }
    });
}

function showDashboard(user) {
    if (!authSection || !dashboard) return;
    authSection.classList.add("hidden");
    profileSetup.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadUserProfile(user);
}

function showAuth() {
    if (!authSection || !dashboard) return;
    authSection.classList.remove("hidden");
    profileSetup.classList.add("hidden");
    dashboard.classList.add("hidden");
    emailInput.value = "";
    passwordInput.value = "";
    if (messageDiv) messageDiv.className = "";
    if (chatBox) chatBox.innerHTML = "";
}

function showProfileSetup() {
    authSection.classList.add("hidden");
    dashboard.classList.add("hidden");
    profileSetup.classList.remove("hidden");
    setupData = { avatarType: null, avatarValue: null, avatarUrl: null, displayName: null, userId: null };
    showSetupStep(1);
    resetSetupUI();
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        showAuth();
        const sideMenu = document.getElementById("sideMenu");
        const menuOverlay = document.getElementById("menuOverlay");
        const burgerBtn = document.getElementById("burgerBtn");
        if (sideMenu) sideMenu.classList.remove("open");
        if (menuOverlay) menuOverlay.classList.remove("open");
        if (burgerBtn) burgerBtn.classList.remove("open");
    } catch (err) { console.error("Logout error:", err); }
}

function showSetupStep(stepNum) {
    document.querySelectorAll(".setup-step").forEach(function(s) { s.classList.add("hidden"); });
    const currentStep = document.getElementById("setupStep" + stepNum);
    if (currentStep) currentStep.classList.remove("hidden");
    document.querySelectorAll(".step-indicator").forEach(function(ind) {
        const step = parseInt(ind.getAttribute("data-step"));
        ind.classList.remove("active", "completed");
        if (step === stepNum) ind.classList.add("active");
        else if (step < stepNum) ind.classList.add("completed");
    });
    document.querySelectorAll(".step-line").forEach(function(line, i) {
        if (i < stepNum - 1) line.classList.add("completed");
        else line.classList.remove("completed");
    });
}

function resetSetupUI() {
    const preview = document.getElementById("avatarPreview");
    const initial = document.getElementById("avatarPreviewInitial");
    if (preview) preview.style.backgroundImage = "";
    if (initial) initial.textContent = "?";
    document.querySelectorAll(".preset-avatar").forEach(function(p) { p.classList.remove("selected"); });
    const displayNameInput = document.getElementById("setupDisplayName");
    if (displayNameInput) displayNameInput.value = "";
    const validation = document.getElementById("nameValidation");
    if (validation) { validation.textContent = ""; validation.className = "name-validation"; }
}

async function isDisplayNameAvailable(name, currentUserId) {
    if (!currentUserId || currentUserId === "") {
        const { data, error } = await supabaseClient.from("profiles").select("id").ilike("full_name", name);
        if (error) return { available: true };
        return { available: data.length === 0 };
    }
    const { data, error } = await supabaseClient.from("profiles").select("id").ilike("full_name", name).neq("user_id", currentUserId);
    if (error) return { available: true };
    return { available: data.length === 0 };
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".preset-avatar").forEach(function(preset) {
        preset.addEventListener("click", function() {
            document.querySelectorAll(".preset-avatar").forEach(function(p) { p.classList.remove("selected"); });
            preset.classList.add("selected");
            const emoji = preset.getAttribute("data-emoji");
            setupData.avatarType = "preset";
            setupData.avatarValue = emoji;
            const preview = document.getElementById("avatarPreview");
            const initial = document.getElementById("avatarPreviewInitial");
            if (preview) preview.style.backgroundImage = "";
            if (initial) initial.textContent = emoji;
        });
    });

    const avatarUpload = document.getElementById("avatarUpload");
    if (avatarUpload) {
        avatarUpload.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alert("File too large! Max 2MB."); return; }
            if (!file.type.startsWith("image/")) { alert("Please select an image."); return; }
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById("avatarPreview");
                const initial = document.getElementById("avatarPreviewInitial");
                if (preview) preview.style.backgroundImage = "url('" + event.target.result + "')";
                if (initial) initial.textContent = "";
            };
            reader.readAsDataURL(file);
            setupData.avatarType = "upload";
            setupData.avatarValue = file;
            document.querySelectorAll(".preset-avatar").forEach(function(p) { p.classList.remove("selected"); });
        });
    }

    const nextToStep2 = document.getElementById("nextToStep2");
    if (nextToStep2) { nextToStep2.addEventListener("click", function() {
        if (!setupData.avatarValue) { alert("Please choose or upload an avatar first!"); return; }
        showSetupStep(2);
    });}

    const backToStep1 = document.getElementById("backToStep1");
    if (backToStep1) { backToStep1.addEventListener("click", function() { showSetupStep(1); }); }

    const backToLogin = document.getElementById("backToLogin");
    if (backToLogin) { backToLogin.addEventListener("click", async function() { await supabaseClient.auth.signOut(); showAuth(); }); }

    const backToStep2 = document.getElementById("backToStep2");
    if (backToStep2) { backToStep2.addEventListener("click", function() { showSetupStep(2); }); }

    const nextToStep3 = document.getElementById("nextToStep3");
    if (nextToStep3) { nextToStep3.addEventListener("click", async function() {
        const nameInput = document.getElementById("setupDisplayName");
        const name = nameInput.value.trim();
        if (!name || name.length < 3) {
            const validation = document.getElementById("nameValidation");
            validation.textContent = "❌ Must be at least 3 characters";
            validation.className = "name-validation taken";
            return;
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !user.id) {
            const validation = document.getElementById("nameValidation");
            validation.textContent = "❌ Session error. Please try again.";
            validation.className = "name-validation taken";
            return;
        }

        setupData.userId = user.id;
        const check = await isDisplayNameAvailable(name, user.id);
        if (!check.available) {
            const validation = document.getElementById("nameValidation");
            validation.textContent = "❌ This name is already taken. Try another!";
            validation.className = "name-validation taken";
            return;
        }
        setupData.displayName = name;
        const reviewName = document.getElementById("reviewName");
        if (reviewName) reviewName.textContent = name;
        const reviewUid = document.getElementById("reviewUid");
        if (reviewUid) reviewUid.textContent = user.id;
        const reviewAvatar = document.getElementById("reviewAvatar");
        const preview = document.getElementById("avatarPreview");
        if (reviewAvatar && preview) {
            reviewAvatar.style.backgroundImage = preview.style.backgroundImage;
            if (!preview.style.backgroundImage) reviewAvatar.textContent = document.getElementById("avatarPreviewInitial").textContent;
            else reviewAvatar.textContent = "";
        }
        showSetupStep(3);
    });}

    const copyUidBtn = document.getElementById("copyUidBtn");
    if (copyUidBtn) { copyUidBtn.addEventListener("click", function() {
        const uid = document.getElementById("reviewUid").textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(uid).then(function() {
                copyUidBtn.textContent = "✅ Copied!";
                setTimeout(function() { copyUidBtn.textContent = "📋 Copy UID"; }, 2000);
            });
        }
    });}

    const finishSetup = document.getElementById("finishSetup");
    if (finishSetup) { finishSetup.addEventListener("click", async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !user.id) {
            document.getElementById("setupMessage").innerHTML = '<div class="status-message show error">❌ Session error. Please sign up again.</div>';
            return;
        }

        finishSetup.disabled = true;
        finishSetup.textContent = "Setting up...";

        try {
            let avatarUrl = null;
            if (setupData.avatarType === "upload" && setupData.avatarValue) {
                const file = setupData.avatarValue;
                const fileExt = file.name.split(".").pop();
                const fileName = user.id + "/avatar." + fileExt;
                const { error: uploadError } = await supabaseClient.storage.from("avatars").upload(fileName, file, { upsert: true });
                if (!uploadError) {
                    const { data: urlData } = supabaseClient.storage.from("avatars").getPublicUrl(fileName);
                    avatarUrl = urlData.publicUrl;
                }
            } else if (setupData.avatarType === "preset") {
                avatarUrl = setupData.avatarValue;
            }

            await supabaseClient.auth.updateUser({ data: { full_name: setupData.displayName } });

            const { data: existingProfile } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            let profileError;
            if (existingProfile) {
                const result = await supabaseClient
                    .from("profiles")
                    .update({ full_name: setupData.displayName, avatar_url: avatarUrl, setup_completed: true })
                    .eq("user_id", user.id);
                profileError = result.error;
            } else {
                const result = await supabaseClient
                    .from("profiles")
                    .insert({ user_id: user.id, full_name: setupData.displayName, avatar_url: avatarUrl, setup_completed: true });
                profileError = result.error;
            }

            if (profileError) {
                if (profileError.code === "23505") {
                    document.getElementById("setupMessage").innerHTML = '<div class="status-message show error">❌ Name was just taken. Go back and pick another.</div>';
                    finishSetup.disabled = false;
                    finishSetup.textContent = "🚀 Enter Hub";
                    return;
                }
                throw profileError;
            }

            showDashboard(user);

        } catch (err) {
            console.error("Setup error:", err);
            document.getElementById("setupMessage").innerHTML = '<div class="status-message show error">❌ Error: ' + err.message + '</div>';
            finishSetup.disabled = false;
            finishSetup.textContent = "🚀 Enter Hub";
        }
    });}

    const setupDisplayName = document.getElementById("setupDisplayName");
    if (setupDisplayName) {
        let checkTimeout;
        setupDisplayName.addEventListener("input", function() {
            const validation = document.getElementById("nameValidation");
            clearTimeout(checkTimeout);
            const name = setupDisplayName.value.trim();
            if (!name) { validation.textContent = ""; validation.className = "name-validation"; return; }
            if (name.length < 3) { validation.textContent = "⚠️ Must be at least 3 characters"; validation.className = "name-validation checking"; return; }
            validation.textContent = "🔍 Checking availability...";
            validation.className = "name-validation checking";
            checkTimeout = setTimeout(async function() {
                const check = await isDisplayNameAvailable(name, setupData.userId);
                if (check.available) { validation.textContent = "✅ Available!"; validation.className = "name-validation available"; }
                else { validation.textContent = "❌ Already taken"; validation.className = "name-validation taken"; }
            }, 500);
        });
    }

    const menuLogoutBtn = document.getElementById("menuLogoutBtn");
    if (menuLogoutBtn) { menuLogoutBtn.addEventListener("click", function(e) { e.preventDefault(); handleLogout(); }); }
});

if (signupBtn) { signupBtn.addEventListener("click", async function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) { showMessage("Please enter email and password", "error"); return; }
    if (password.length < 6) { showMessage("Password must be 6+ characters", "error"); return; }
    signupBtn.disabled = true;
    const originalText = signupBtn.textContent;
    signupBtn.textContent = "Creating...";
    const result = await supabaseClient.auth.signUp({ email: email, password: password });
    signupBtn.disabled = false;
    signupBtn.textContent = originalText;
    if (result.error) { showMessage(result.error.message, "error"); }
    else if (result.data && result.data.user) {
        setupData.userId = result.data.user.id;
        showProfileSetup();
    } else { showMessage("Account created! Check your email to confirm.", "success"); }
});}

if (loginBtn) { loginBtn.addEventListener("click", async function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) { showMessage("Please enter email and password", "error"); return; }
    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Signing in...";
    const result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
    if (result.error) { showMessage(result.error.message, "error"); }
    else if (result.data && result.data.user) {
        const { data: profile } = await supabaseClient.from("profiles").select("setup_completed").eq("user_id", result.data.user.id).maybeSingle();
        if (profile && profile.setup_completed) { showDashboard(result.data.user); }
        else { setupData.userId = result.data.user.id; showProfileSetup(); }
    }
});}

if (forgotPasswordBtn) { forgotPasswordBtn.addEventListener("click", async function() {
    const email = emailInput.value.trim();
    if (!email) { showMessage("Enter your email first", "error"); return; }
    const result = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (result.error) { showMessage(result.error.message, "error"); }
    else { showMessage("Password reset email sent!", "success"); }
});}

if (googleBtn) { googleBtn.addEventListener("click", async function() {
    const result = await supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://skillsharejsorg.netlify.app" } });
    if (result.error) { showMessage(result.error.message, "error"); }
});}

if (saveProfileBtn) { saveProfileBtn.addEventListener("click", async function() {
    const newName = editUsername.value.trim();
    if (!newName || newName.length < 3) { showMessage("Name must be at least 3 characters", "error"); return; }
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Checking...";
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user || !user.id) { saveProfileBtn.disabled = false; saveProfileBtn.textContent = "Save Configurations"; return; }
    const check = await isDisplayNameAvailable(newName, user.id);
    if (!check.available) { saveProfileBtn.disabled = false; saveProfileBtn.textContent = "Save Configurations"; showMessage("❌ Display name already in use!", "error"); return; }
    saveProfileBtn.textContent = "Saving...";
    await supabaseClient.auth.updateUser({ data: { full_name: newName } });
    const profileResult = await supabaseClient.from("profiles").update({ full_name: newName }).eq("user_id", user.id);
    if (profileResult.error) { saveProfileBtn.disabled = false; saveProfileBtn.textContent = "Save Configurations"; showMessage("❌ " + (profileResult.error.code === "23505" ? "Already in use!" : profileResult.error.message), "error"); return; }
    userName.textContent = newName;
    userAvatar.textContent = newName[0].toUpperCase();
    if (menuAvatar) menuAvatar.textContent = newName[0].toUpperCase();
    if (menuUserName) menuUserName.textContent = newName;
    showMessage("✅ Profile updated!", "success");
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.classList.remove("open");
    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = "Save Configurations";
});}

if (searchBtn) { searchBtn.addEventListener("click", async function() {
    const query = searchInput.value.trim();
    if (!query) { searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">🔎 Type a name or UID</div>'; return; }
    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";
    searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">Searching...</div>';
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user ? user.id : null;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUidSearch = uuidPattern.test(query);
    let result;
    if (isUidSearch) {
        result = await supabaseClient.from("profiles").select("user_id, full_name, skills_offered, avatar_url").eq("user_id", query).neq("user_id", currentUserId || "");
    } else {
        result = await supabaseClient.from("profiles").select("user_id, full_name, skills_offered, avatar_url").ilike("full_name", "%" + query + "%").neq("user_id", currentUserId || "").limit(20);
    }
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
    if (result.error) { searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 20px;">⚠️ ' + result.error.message + '</div>'; return; }
    if (!result.data || result.data.length === 0) {
        const msg = isUidSearch ? "No user found with that UID" : "No users matching \"" + query + "\"";
        searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">🤷 ' + msg + '</div>';
        return;
    }
    searchResults.innerHTML = result.data.map(function(p) {
        const uidShort = p.user_id ? p.user_id.substring(0, 8) + "..." : "N/A";
        const avatarDisplay = p.avatar_url ? (p.avatar_url.startsWith("http") ? '<img src="' + p.avatar_url + '">' : '<span style="font-size:2.4rem;">' + p.avatar_url + '</span>') : '<span style="font-size:2.4rem;">👤</span>';
        return '<div class="roblox-game-card user-card" data-uid="' + (p.user_id || "") + '" style="cursor: pointer;">' +
            '<div class="card-display-icon">' + avatarDisplay + '</div>' +
            '<div class="card-details">' +
                '<div class="game-title">' + (p.full_name || "Anonymous") + '</div>' +
                '<div class="game-stats">🎯 ' + (p.skills_offered || "No skills yet") + '</div>' +
                '<div class="game-stats" style="margin-top: 4px; font-size: 0.7rem; opacity: 0.7;">🆔 ' + uidShort + '</div>' +
            '</div></div>';
    }).join("");
    document.querySelectorAll('.user-card').forEach(function(card) {
        card.addEventListener('click', function() {
            const uid = card.getAttribute('data-uid');
            if (uid && navigator.clipboard) {
                navigator.clipboard.writeText(uid);
                const original = card.style.boxShadow;
                card.style.boxShadow = '0 0 0 3px var(--success)';
                setTimeout(function() { card.style.boxShadow = original; }, 1000);
            }
        });
    });
});}

if (searchInput) { searchInput.addEventListener("keypress", function(e) { if (e.key === "Enter") searchBtn.click(); }); }

if (messageForm) { messageForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    const userResult = await supabaseClient.auth.getUser();
    if (!userResult.data || !userResult.data.user || !userResult.data.user.id) {
        console.error("No valid user for message");
        return;
    }
    const userId = userResult.data.user.id;
    const insertResult = await supabaseClient.from("messages").insert([{ message_text: text, sender_id: userId }]);
    if (!insertResult.error) messageInput.value = "";
});}

if (supabaseClient) { supabaseClient.channel("messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function(payload) {
    if (!chatBox) return;
    const msg = document.createElement("div");
    msg.className = "chat-bubble";
    const sender = (payload.new.sender_id || "s").slice(0, 6);
    msg.innerHTML = '<div class="sender-tag">Student ' + sender + '</div>' + payload.new.message_text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}).subscribe();}

(async function() {
    const result = await supabaseClient.auth.getSession();
    if (result.data && result.data.session && result.data.session.user && result.data.session.user.id) {
        const { data: profile } = await supabaseClient.from("profiles").select("setup_completed").eq("user_id", result.data.session.user.id).maybeSingle();
        if (profile && profile.setup_completed) { showDashboard(result.data.session.user); }
        else { setupData.userId = result.data.session.user.id; showProfileSetup(); }
    }
})();

supabaseClient.auth.onAuthStateChange(function(event, session) {
    if (event === "SIGNED_OUT") showAuth();
});
