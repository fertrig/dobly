var socket = io.connect(window.location.origin, {
	'sync disconnect on unload': true
});

var desktop;

$(document).ready(function() {

	var desktopData = JSON.parse($('#desktop').val());
	var conversationData = JSON.parse($('#conversations').val());
	
	var viewModel = createViewModel(conversationData, desktopData);

	ko.applyBindings(viewModel);

	desktop = viewModel.desktop;
	desktop.resize.dualConvo();
	desktop.resize.strip();
	desktop.setupStripDragAndDrop();

	var currentUserData = JSON.parse($('#currentUser').val());
	$('#user-name').text(currentUserData.username);
});

$(window).load(function() {
	desktop.resize.convoBody();
	desktop.scroll.setup();
});

$(window).resize(function() {
	desktop.resize.dualConvo();
	desktop.resize.convoBody();
});
