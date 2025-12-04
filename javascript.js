// --- DATA ISOLATION LOGIC ---
let users = [
    { id: 1, name: "Adrian", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Adrian" }
];
let activeUserId = 1;
let tempUser = { name: "", avatar: "" };
let isCreatingNewUser = false; 

let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();
let currentDateAPI = new Date();

let checklists = [
    { id: 1, userId: 1, title: 'Jogging', date: '2025-04-09', time: '06:00', icon: 'directions_run', colorClass: 'bg-purple', items: ['Water', 'Towel'] },
    { id: 2, userId: 1, title: 'Swimming', date: '2025-04-11', time: '07:00', icon: 'pool', colorClass: 'bg-orange', items: ['Goggles'] }
];

let tempNewListItems = [];
let currentEditingListId = null;
let isEditMode = false;

const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Adrian",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Granny"
];

document.addEventListener('DOMContentLoaded', () => {
    fetchDateFromAPI();
    setInterval(updateHomeClock, 1000);

    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            navigateTo('add-user-screen'); 
            isCreatingNewUser = true; 
            resetUserForm();
        }, 500);
    }, 2000);

    updateProfileDisplay();
    renderApp();
    setupTrashDragDrop();
    setupProfileTrashDragDrop();
});

// --- CLOCK ---
async function fetchDateFromAPI() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/ip');
        const data = await response.json();
        currentDateAPI = new Date(data.datetime);
        displayedMonth = currentDateAPI.getMonth();
        displayedYear = currentDateAPI.getFullYear();
        renderCalendar();
    } catch (error) {
        currentDateAPI = new Date();
        renderCalendar();
    }
}
function updateHomeClock() {
    const now = new Date(); 
    const hrs = now.getHours();
    const mins = String(now.getMinutes()).padStart(2,'0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 || 12;
    document.getElementById('current-time-display').innerText = `${displayHrs}:${mins} ${ampm}`;
}

// --- NAVIGATION ---
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if(screenId === 'home-screen') { renderCalendar(); updateProfileDisplay(); renderApp(); }
    if(screenId === 'profile-screen') updateProfileDisplay();
}

// --- USER MANAGEMENT ---
function startAddUserFlow() {
    isCreatingNewUser = true;
    resetUserForm();
    document.getElementById('user-screen-title').innerText = "Add New User";
    document.getElementById('user-back-btn').onclick = () => navigateTo('profile-screen');
    navigateTo('add-user-screen');
}

function startEditUserFlow() {
    isCreatingNewUser = false;
    const currentUser = users.find(u => u.id === activeUserId);
    if(!currentUser) return;
    tempUser = { ...currentUser };
    document.getElementById('username-input').value = tempUser.name;
    document.getElementById('setup-main-avatar').src = tempUser.avatar;
    renderAvatarGrid();
    document.getElementById('user-screen-title').innerText = "Edit Profile";
    document.getElementById('user-back-btn').onclick = () => navigateTo('profile-screen');
    navigateTo('add-user-screen');
}

function renderAvatarGrid() {
    const grid = document.getElementById('setup-avatar-grid');
    grid.innerHTML = '';
    avatars.forEach(url => {
        const div = document.createElement('div');
        div.className = `avatar-option ${url === tempUser.avatar ? 'selected' : ''}`;
        div.innerHTML = `<img src="${url}">`;
        div.onclick = () => {
            tempUser.avatar = url;
            document.getElementById('setup-main-avatar').src = url;
            renderAvatarGrid();
        };
        grid.appendChild(div);
    });
}
function resetUserForm() {
    tempUser = { name: "", avatar: avatars[0] };
    document.getElementById('username-input').value = "";
    document.getElementById('setup-main-avatar').src = tempUser.avatar;
    renderAvatarGrid();
}
function cancelUserAction() {
    if(users.length > 0) navigateTo('home-screen');
    else alert("Please create a user.");
}

function saveUser() {
    const nameVal = document.getElementById('username-input').value.trim();
    if(!nameVal) { alert("Please enter a name"); return; }
    tempUser.name = nameVal;
    if (isCreatingNewUser) {
        const newId = Date.now();
        users.push({ id: newId, name: tempUser.name, avatar: tempUser.avatar });
        // Switch to new user immediately
        activeUserId = newId;
    } else {
        const userIndex = users.findIndex(u => u.id === activeUserId);
        if(userIndex > -1) users[userIndex] = { ...users[userIndex], name: tempUser.name, avatar: tempUser.avatar };
    }
    updateProfileDisplay();
    // Render app will filter for new user (empty lists) or existing user
    renderApp(); 
    navigateTo('home-screen');
}

function updateProfileDisplay() {
    const currentUser = users.find(u => u.id === activeUserId);
    if(!currentUser) return;
    document.getElementById('home-avatar-img').src = currentUser.avatar;
    document.getElementById('profile-main-avatar').src = currentUser.avatar;
    document.getElementById('profile-display-name').innerText = currentUser.name;

    const otherUsersContainer = document.getElementById('other-users-list');
    otherUsersContainer.innerHTML = '';
    users.forEach(u => {
        const div = document.createElement('div');
        div.className = `small-user-avatar ${u.id === activeUserId ? 'active-user' : ''}`;
        div.innerHTML = `<img src="${u.avatar}">`;
        div.draggable = true;
        div.onclick = () => {
            activeUserId = u.id;
            updateProfileDisplay();
            renderApp(); // IMPORTANT: Re-render for new user
            navigateTo('home-screen');
        };
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/user-id', u.id);
        });
        otherUsersContainer.appendChild(div);
    });
}

function setupProfileTrashDragDrop() {
    const trash = document.getElementById('profile-trash-target');
    trash.addEventListener('dragover', (e) => { e.preventDefault(); trash.classList.add('trash-hover'); });
    trash.addEventListener('dragleave', () => trash.classList.remove('trash-hover'));
    trash.addEventListener('drop', (e) => {
        e.preventDefault(); trash.classList.remove('trash-hover');
        const userId = parseInt(e.dataTransfer.getData('text/user-id'));
        if(userId) deleteUserById(userId);
    });
}

function deleteUserById(id) {
    if(users.length <= 1) { alert("Cannot delete the only user."); return; }
    if(confirm("Delete this user and their data?")) {
        // Cascade Delete: Remove lists for this user
        checklists = checklists.filter(item => item.userId !== id);
        
        // Remove User
        users = users.filter(u => u.id !== id);
        
        // If active user deleted, switch to first available
        if(activeUserId === id) activeUserId = users[0].id;
        
        updateProfileDisplay();
        renderApp();
    }
}

// --- CALENDAR & LISTS (FILTERED BY USER) ---
function changeMonth(dir) {
    displayedMonth += dir;
    if(displayedMonth > 11) { displayedMonth = 0; displayedYear++; }
    if(displayedMonth < 0) { displayedMonth = 11; displayedYear--; }
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-days-grid');
    const header = document.getElementById('calendar-month-year');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    header.innerText = `${monthNames[displayedMonth]} ${displayedYear}`;
    
    grid.innerHTML = '';
    const firstDayIndex = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();

    // Filter checklists for active user only
    const userLists = checklists.filter(c => c.userId === activeUserId);

    for(let i=0; i<firstDayIndex; i++) grid.appendChild(Object.assign(document.createElement('div'), {className: 'day empty'}));

    for(let d=1; d<=daysInMonth; d++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.innerText = d;
        const dateString = `${displayedYear}-${String(displayedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        
        if (currentDateAPI.getDate() === d && currentDateAPI.getMonth() === displayedMonth && currentDateAPI.getFullYear() === displayedYear) dayDiv.classList.add('today-marker');
        // Check only user's lists
        if(userLists.some(item => item.date === dateString)) dayDiv.classList.add('has-event');
        grid.appendChild(dayDiv);
    }
}

function renderApp() {
    const homeContainer = document.getElementById('home-reminders-list');
    const listsContainer = document.getElementById('all-lists-container');
    homeContainer.innerHTML = ''; listsContainer.innerHTML = '';

    // Filter checklists for active user only
    const userLists = checklists.filter(c => c.userId === activeUserId);

    userLists.forEach(item => {
        const card = document.createElement('div');
        card.className = 'reminder-card';
        card.onclick = () => openChecklist(item);
        card.innerHTML = `<div class="icon-box ${item.colorClass}"><span class="material-icons-round">${item.icon}</span></div><span class="rem-title">${item.title}</span><span class="rem-date">${formatDate(item.date)}</span><span class="rem-time">${item.time}</span>`;
        homeContainer.appendChild(card);
        
        const li = document.createElement('div');
        li.className = 'list-item';
        li.draggable = true;
        li.addEventListener('dragstart', (e) => { li.classList.add('dragging'); e.dataTransfer.setData('text/list-id', item.id); });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.onclick = () => openChecklist(item);
        li.innerHTML = `<div class="icon-box ${item.colorClass}"><span class="material-icons-round">${item.icon}</span></div><div class="list-text">${item.title}</div><div style="color: #666; font-size:0.8rem; margin-right:10px;">${formatDate(item.date)}</div><span class="material-icons-round arrow">chevron_right</span>`;
        listsContainer.appendChild(li);
    });
}

function setupTrashDragDrop() {
    const trash = document.getElementById('trash-target');
    trash.addEventListener('dragover', (e) => { e.preventDefault(); trash.classList.add('trash-hover'); });
    trash.addEventListener('dragleave', () => trash.classList.remove('trash-hover'));
    trash.addEventListener('drop', (e) => {
        e.preventDefault(); trash.classList.remove('trash-hover');
        const id = e.dataTransfer.getData('text/list-id');
        if(id) { checklists = checklists.filter(i => i.id != id); renderApp(); renderCalendar(); }
    });
}

// --- CHECKLIST ---
function openChecklist(item) {
    currentEditingListId = item.id;
    isEditMode = false;
    updateChecklistUI(item);
    navigateTo('checklist-screen');
}
function updateChecklistUI(item) {
    document.getElementById('cl-title').innerText = item.title;
    document.getElementById('cl-date').innerText = formatDate(item.date);
    document.getElementById('cl-time').innerText = item.time;
    document.getElementById('cl-view-header').style.display = isEditMode ? 'none' : 'block';

    document.getElementById('edit-cl-title').value = item.title;
    document.getElementById('edit-cl-date').value = item.date;
    document.getElementById('edit-cl-time').value = item.time;
    document.getElementById('cl-edit-header').style.display = isEditMode ? 'block' : 'none';

    document.getElementById('cl-edit-icon').innerText = isEditMode ? 'save' : 'edit';
    document.getElementById('cl-action-btn').innerText = isEditMode ? 'Save & Close' : 'Done';
    document.getElementById('cl-action-btn').onclick = isEditMode ? saveChecklistDetails : () => navigateTo('home-screen');

    const container = document.getElementById('cl-items-container');
    container.innerHTML = '';
    item.items.forEach((txt, idx) => {
        if(isEditMode) {
            const row = document.createElement('div');
            row.className = 'checkbox-container';
            row.style.justifyContent = 'space-between';
            row.innerHTML = `<span class="text" style="margin-left:0">${txt}</span><span class="material-icons-round delete-item-icon" onclick="deleteChecklistItem(${idx})">remove_circle</span>`;
            container.appendChild(row);
        } else {
            const label = document.createElement('label');
            label.className = 'checkbox-container';
            label.innerHTML = `<input type="checkbox"><span class="checkmark-box"></span><span class="text">${txt}</span>`;
            container.appendChild(label);
        }
    });
}
function toggleEditChecklistMode() {
    if(isEditMode) saveChecklistDetails();
    else { isEditMode = true; updateChecklistUI(checklists.find(c => c.id == currentEditingListId)); }
}
function saveChecklistDetails() {
    const title = document.getElementById('edit-cl-title').value;
    const date = document.getElementById('edit-cl-date').value;
    const time = document.getElementById('edit-cl-time').value;
    const index = checklists.findIndex(c => c.id == currentEditingListId);
    if(index > -1) { checklists[index].title = title; checklists[index].date = date; checklists[index].time = time; }
    isEditMode = false;
    updateChecklistUI(checklists[index]);
    renderApp(); renderCalendar();
}
function deleteChecklistItem(idx) {
    const index = checklists.findIndex(c => c.id == currentEditingListId);
    if(index > -1) { checklists[index].items.splice(idx, 1); updateChecklistUI(checklists[index]); }
}
function addChecklistItemInEdit() {
    const val = document.getElementById('add-cl-item-input').value.trim();
    if(val) {
        const index = checklists.findIndex(c => c.id == currentEditingListId);
        if(index > -1) { checklists[index].items.push(val); updateChecklistUI(checklists[index]); document.getElementById('add-cl-item-input').value=''; }
    }
}
function addTempItem() {
    const val = document.getElementById('new-item-input').value.trim();
    if(val) { tempNewListItems.push(val); renderTempItems(); document.getElementById('new-item-input').value = ''; }
}
function renderTempItems() {
    document.getElementById('temp-items-list').innerHTML = tempNewListItems.map((t, i) => `<div class="temp-tag">${t} <span style="color:red;cursor:pointer;margin-left:5px" onclick="removeTempItem(${i})">×</span></div>`).join('');
}
function removeTempItem(i) { tempNewListItems.splice(i, 1); renderTempItems(); }
function createNewList() {
    const title = document.getElementById('new-list-title').value;
    const date = document.getElementById('new-list-date').value;
    const time = document.getElementById('new-list-time').value;
    if(!title || !date) { alert("Title and Date required"); return; }
    
    // Create List with Active User ID
    checklists.push({ 
        id: Date.now(), 
        userId: activeUserId, 
        title, date, time: time || 'All Day', 
        icon: 'checklist', colorClass: 'bg-blue', items: [...tempNewListItems] 
    });
    
    tempNewListItems = []; renderTempItems(); 
    renderApp(); renderCalendar(); 
    navigateTo('lists-screen');
}
function formatDate(isoStr) {
    if(!isoStr) return "";
    const parts = isoStr.split('-');
    return new Date(parts[0], parts[1]-1, parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}