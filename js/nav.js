$( "#home" ).load( "pages/home.html" );
$( "#about" ).load( "pages/about.html" );
$(".nav a").on('click',function(e) {
	e.preventDefault(); // stops link form loading
	$('.navbar-nav li.active').removeClass('active');
	var $menu = $(this).parent();
	if (!$menu.hasClass('active')) {
		$menu.addClass('active');
	}
	$('.content').hide(); // hides all content divs
	$( $(this).attr('href') ).show(); //get the href and use it find which div to show
});
