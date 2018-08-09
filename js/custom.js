jQuery(document).ready(function() {
	$.cookie('curr_lan') ? loadBundles($.cookie('curr_lan')) : loadBundles('zh');
			
	// configure language combo box
	jQuery('#lang').change(function() {
		// alert('123');
		var selection = jQuery('#lang option:selected').val();
		console.log(selection);
		loadBundles(selection != 'browser' ? selection : null);
		jQuery('#langBrowser').empty();
		if(selection == 'browser') {
			jQuery('#langBrowser').text('('+jQuery.i18n.browserLang()+')');
		}
	});

	$('.lan-change li').click(function(){
		if($.cookie('curr_lan') != $(this).attr('lan')){
			if($(this).attr('lan') == 'en'){
				loadBundles('en')
				$('.tran-title').text(' ENGLISH ')
				$.cookie('curr_lan', 'en');
				window.location.reload()
			}else if($(this).attr('lan') == 'zh'){
				loadBundles('zh')
				$('.tran-title').text(' 简体中文 ')
				$.cookie('curr_lan', 'zh');
				window.location.reload()
			}else{
				return ;
			}
		}
			
	})
	
	// load files just for display purposes...
	// jQuery('h4').each(function() {
	// 	var file = 'bundle/' + jQuery(this).text();
	// 	var code = jQuery(this).next().next('code');
	// 	jQuery.get(file, function(data) {
	// 		data = data.replace(/\n/mg, '<br/>');
	// 		code.html(data);
	// 	});
	// });
	// // ... and configure links to show/hide them
	// jQuery('a.toggle').bind('click', function() {
	//   jQuery(this).next('code').slideToggle();
	// 	return false;
	// });
});
		
function loadBundles(lang) {
	if(lang === 'en'){
		$('.tran-title').text(' ENGLISH ')
	}else{
		$('.tran-title').text(' 简体中文 ')
	}

	jQuery.i18n.properties({
	    name:'Messages', 
	    path:'./i18n/bundle/', 
	    mode:'both',
	    language:lang, 
	    callback: function() {
	        updateExamples();
	    }
	});
}
		
function updateExamples() {

		var insertEle = $(".i18n");
        console.log(".i18n 写入中...");
        insertEle.each(function() {
            // 根据i18n元素的 name 获取内容写入
            console.log($(this).attr('fy'))
            $(this).html($.i18n.prop($(this).attr('fy')));
        });
        console.log("写入完毕");
}


  				// console.log(".i18n-input 写入中...");
      //           var insertInputEle = $(".i18n-input");
      //           insertInputEle.each(function() {
      //               var selectAttr = $(this).attr('selectattr');
      //               if (!selectAttr) {
      //                   selectAttr = "value";
      //               };
      //               $(this).attr(selectAttr, $.i18n.prop($(this).attr('selectname')));
      //           });
      //           console.log("写入完毕");
		
		
