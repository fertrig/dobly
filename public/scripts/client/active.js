var socket = io.connect(window.location.origin);
var desktop;

$(document).ready(function() {

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#data').val());
	
	var viewModel = createViewModel(conversationData, desktopData);

	ko.applyBindings(viewModel);

	desktop = viewModel.desktop;
	desktop.resize.dualConvo();
	desktop.resize.strip();
	//viewModel.desktop.setupSorting();
});

$(window).load(function() {
	desktop.resize.convoBody();
	desktop.scroll.setup();
})

$(window).resize(function() {
	desktop.resize.dualConvo();
	desktop.resize.convoBody();
	desktop.scroll.setup();
});

window.onbeforeunload = function() { 
	socket.emit('remove_active_user'); 
};