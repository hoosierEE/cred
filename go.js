chrome.app.runtime.onLaunched.addListener(()=>{
    chrome.app.window.create('main_window.html',{id:'mainwin'});
});
