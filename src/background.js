chrome.app.runtime.onLaunched.addListener(()=>{
    chrome.app.window.create('main.html',{id:'main_window'});
});
