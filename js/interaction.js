//本地测试
// const	network = {
//     protocol:'http', // Defaults to https
//     blockchain:'eos',
//     host:'127.0.0.1', // ( or null if endorsed chainId )
//     port:8888, // ( or null if defaulting to 80 )
//     chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
//     verbose:true
// }

//线上测试

 
const	network = {
    protocol:'https', // Defaults to https
    blockchain:'eos',
    host:'api-kylin.eosasia.one', // ( or null if endorsed chainId )
    port:443, // ( or null if defaulting to 80 )
    chainId:'5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    verbose:true
}


const	codeName	=	'bidnamefirst';
const	scope 		=	'bidnamefirst';
const	reqListUrl	=	'https://139.196.84.116:3000/';
let 	homeCurPageNum =	1;
const 	perPage		=	20;
//eos 与 scatter 是两个全局变量
let eos;



function validScatterPer(){
   		this.scatter.getIdentity(network).then(identity => {
    		console.log(identity)
		}).catch(error => {
		    console.log(error)
		});
}


async function assignPer(accName, assignOrCancel = 'assign', permission = 'active'){
	assignOrCancelCodePer(accName, assignOrCancel,	permission).then(val=>{
			getFormatAccountInfo({'name':accName, 'authority':permission})
		},err=>{
			console.log(err)
		})
}


async function cancelAssign(accName, assignOrCancel = 'cancel',permission = 'active'){
	assignOrCancelCodePer(accName, assignOrCancel,	permission).then(val=>{
			getFormatAccountInfo({'name':accName, 'authority':permission})
		},err=>{
			console.log(err)
		})
}


function buy(num,orderId){
	if($('.second-kind').css('display') === 'block'){
		$("#account-name").text($('.acc-name').text());
		$("#account-price").text($('.sell-price').text());
		
	}else{
		const tem = $("#main table tr").eq(num);
		$("#account-name").text(tem.find("td").eq(0).text());
		$("#account-price").text(tem.find("td").eq(1).text());
		$("input[name='order-id']").val(orderId);
	}

	
	$(".pub-key").val("");
	$("#buy-modal").modal();
}




//认证权限

async function checkLogin(accName,	permission = 'active'){
//todo  先获取scatter的信息

	await scatter.authenticate().then(async sig =>{//这里不加await会导致捕捉不到异常
	
		 await scatter.getIdentity({ accounts:[network] }).then(identity=>
			{

				let account = identity.accounts.find(acc => acc.blockchain === 'eos')

				if(account.name != accName || account.authority != permission){
					throw new Error($.i18n.prop("login_transfer",accName,permission))
				}else{
					return true;
				}
			},err=>{
				throw new Error($.i18n.prop('cannot_get_scatter_info'))
			})

	},err=>{
		throw new Error($.i18n.prop('login_first'))
	})

}



//给账号赋值code权限，input_eosaccount是直接传入相关信息，减少重复查询时间
async function assignOrCancelCodePer( account_name, assignOrCancel = 'assign', permission = 'active', input_eosaccount = ''){

	let eosaccount;

	if(input_eosaccount){
		eosaccount = input_eosaccount;
	}else{
		eosaccount = await eos.getAccount(account_name);
	}
    
    let whichPer = '';

    for(whichPer in eosaccount.permissions){
    	if(eosaccount.permissions[whichPer].perm_name === permission){
    		break;
    	}
    }


    if(assignOrCancel == 'assign'){//授权

    	for(let acc of eosaccount.permissions[whichPer].required_auth.accounts){
	    	if(acc.permission.actor === codeName && acc.permission.permission === 'eosio.code'){
	    		return true;
	    	}
   		}
    	eosaccount.permissions[whichPer].required_auth.accounts.push({"permission": {"actor": codeName,"permission": "eosio.code"},"weight": 1})
    }else{//取消授权
    	
    	const temAccounts	=	eosaccount.permissions[whichPer].required_auth.accounts
    	let newAccounts = []

    	for(let i in temAccounts){

    		console.log(temAccounts[i].permission.actor,'~~~~~',temAccounts[i].permission.permission )

	    	if(temAccounts[i].permission.actor !== codeName || temAccounts[i].permission.permission !== 'eosio.code'){
	    		newAccounts.push(temAccounts[i])
	    	} 
   		}
   		eosaccount.permissions[whichPer].required_auth.accounts = newAccounts
    }



    //检查当前scatter账户名是否为需要授权账户
    console.log('eosaccount=====>',eosaccount.permissions[whichPer].required_auth.accounts)


    let newAuth = {
      "account": account_name,
      "permission": permission,
      "parent": eosaccount.permissions[whichPer].parent,
      "auth": eosaccount.permissions[whichPer].required_auth
    }

	console.log('newAuth------------',newAuth)

	let options = {
		  authorization: `${account_name}@${permission}`,
		  broadcast: true,
		  sign: true
		};

    try{
      	let returnMessage = await eos.updateauth(newAuth, options)
      	console.log('returnMessage=====>',returnMessage)
      	if(assignOrCancel == 'assign'){
      		alert($.i18n.prop('auth_success'))
      	}else{
      		alert($.i18n.prop('cancel_auth_success'))
      	}

      	return true;
    }catch(err){
      	console.log(err)

      	console.log(typeof err)

      	if(typeof err == 'object'){
      		if(assignOrCancel == 'assign'){
      			if(err.type === 'signature_rejected'){
	      			alert($.i18n.prop('scatter_reject_auth_fail'))
	      		}else{
	      			alert($.i18n.prop('auth_fail_detail', err.code, err.message))
	      		}
      		}else{
      			if(err.type === 'signature_rejected'){
      				alert($.i18n.prop('scater_reject_cancel_auth_fail'))
	      		}else{
	      			alert($.i18n.prop('cancel_auth_fail_detail', err.code, err.message))
	      		}
      		}

      		
      		
      	}else{
      		const errObj	=	JSON.parse(err);
	      	const code 		=	errObj.error.code;
	      	if(assignOrCancel == 'assign'){
	      		alert($.i18n.prop('auth_fail_detail_kind2', code, errObj.error.what , errObj.error.details[0].message))
	      	}else{
	      		alert($.i18n.prop('cancel_auth_fail_detail_kind2', code, errObj.error.what, errObj.error.details[0].message))
	      	}
			
			console.log(errObj.error.what)
			console.log(errObj.error.details[0].message)
      	}
      	

      	if(assignOrCancel == 'assign'){
      		throw new Error($.i18n.prop('auth_failed'))
      	}else{
      		throw new Error($.i18n.prop('cancel_auth_failed'))
      	}
      	
    }

}


async function getFormatAccountInfo({name,authority}){
	console.log('name--',name,'---authority---',authority)
	let eosaccount = await eos.getAccount(name);
	const balance	=	eosaccount.core_liquid_balance ? eosaccount.core_liquid_balance : 0;
	let assginStr	=	`<li class="list-group-item">${$.i18n.prop('unauthorized_code')}<button class="btn btn-warning badge assignPer" onclick="assignPer('${eosaccount.account_name}','assign', '${authority}')">${$.i18n.prop('click_to_authorized_code')}</button></li>`;

	let whichPer = '';

    for(whichPer in eosaccount.permissions){
    	if(eosaccount.permissions[whichPer].perm_name === authority){
    		break;
    	}
    }


	for(let acc of eosaccount.permissions[whichPer].required_auth.accounts){
    	if(acc.permission.actor === codeName && acc.permission.permission === 'eosio.code'){
    		assginStr	=	`<li class="list-group-item">${$.i18n.prop('authorized_code_success')}<button class="btn btn-warning badge cancelAssign" onclick="cancelAssign('${eosaccount.account_name}','cancel', '${authority}')">${$.i18n.prop('click_to_cancel_authorized_code')}</button></li>`;
    		break;
    		//return true;
    	}
    }


	let catStr	=	`
	<li class="list-group-item"><span class="badge">${$.i18n.prop('li_current_account_and_permission')}</span>${eosaccount.account_name}@${authority}</li>  ${assginStr}
	<li class="list-group-item"><span class="badge">${$.i18n.prop('balance')}</span>${balance}</li>
	<li class="list-group-item"><span class="badge">${$.i18n.prop('memory')}</span>${eosaccount.ram_quota} / ${eosaccount.ram_usage}</li>
	<li class="list-group-item"><span class="badge">CPU</span>${eosaccount.cpu_limit.available} / ${eosaccount.cpu_limit.max} / ${eosaccount.cpu_limit.used}</li>
	<li class="list-group-item"><span class="badge">NET</span>${eosaccount.net_limit.available} / ${eosaccount.net_limit.max} / ${eosaccount.net_limit.used}</li>
	<li class="list-group-item" style="text-align:center;"><button type="button" class="btn btn-info logout-scatter" >${$.i18n.prop('scatter_logout')}</button> <button type="button" class="btn btn-info change-scatter" >${$.i18n.prop('switch_scatter')}</button></li>
	`;

	$('#account-info').html(catStr)

	if($('#sell-acc-name').length > 0){//挂单页面自动填写卖出账号
		$('#sell-acc-name').val(name)
	}

	if($('input[name="buyer-acc-name"]').length == 1){
		$('input[name="buyer-acc-name"]').val(name)
	}

	if($('#my-orders').length > 0){//我的订单页面，同-搜索页面
		const acc = name;
		let   isHaveResult	=	false;

		const p1 = new Promise((resolve, reject) => {

			$.get(`${reqListUrl}getOrderBySeller`, {'seller':acc},
			   	function(data){

			   		if(data.length > 0 ){

				   		let trList	=	searchConstructStr(data);
				     	$('#search_acc_list').html(trList);
				     	isHaveResult	=	true;
				     	$('.first-kind').show();
				     	$('.second-kind').hide();
		     	   	}
		     	   	resolve('ok')

		   	}, "json");

		})

		const p2 = new Promise((resolve, reject) => {

			$.get(`${reqListUrl}getOrderByAcc`, {'acc':acc},
		   	function(data){

		   		if(data.length > 0 ){

			   		let trList	=	secondKindShow(data);
			     	isHaveResult	=	true;
			     	$('.first-kind').hide();
			     	$('.second-kind').show();
	     	   	}
	     	   	resolve('ok')

		   	}, "json");

		})

		Promise.all([p1, p2])
		.then(result => {
			 if(!isHaveResult){
		   	 	$('.left-container').html($.i18n.prop('not_found_your_order'))
		   	 }
		})
		.catch(e => console.log(e));

	   	

	}

	console.log('eosaccount====>', eosaccount)
}


function clearNoNum(obj){

    obj.value = obj.value.replace(/[^\d.]/g,""); //清除"数字"和"."以外的字符

    obj.value = obj.value.replace(/^\./g,""); //验证第一个字符是数字而不是

    obj.value = obj.value.replace(/\.{2,}/g,"."); //只保留第一个. 清除多余的

    obj.value = obj.value.replace(".","$#$").replace(/\./g,"").replace("$#$",".");

    obj.value = obj.value.replace(/^(\-)*(\d+)\.(\d\d\d\d).*$/,'$1$2.$3'); //只能输入两个小数


}

// 解决浮点数
function accMul(arg1,arg2){
    {   
        if(arg1 == undefined || arg2 == undefined){
            return
        }
        var m=0,s1=arg1.toString(),s2=arg2.toString();   
        try{m+=s1.split(".")[1].length}catch(e){}   
        try{m+=s2.split(".")[1].length}catch(e){}   
        return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)   
    }
}


function constructStr(data){
	let trList	=	'';
	if(data && data.orderList.length > 0){
 		for(let i in data.orderList){
 			
 			trList	+=	`<tr>
 				<td>${data.orderList[i].acc}</td>
 				<td>${parseFloat(data.orderList[i].price.amount).toFixed(4)}</td>
 				<td>${parseFloat(data.orderList[i].adfee.amount).toFixed(4)}</td>
 				<td>${data.orderList[i].createdat.substring(0, 10)}</td>
 				<td><button type="button" class="btn btn-primary" onclick="buy(${i*1 + 1},'${data.orderList[i]._id}')">${$.i18n.prop('place_order')}</button></td>
 				</tr>`;
 		}
 		

 	}
 	return trList;
}

function searchConstructStr(data){
	let trList	=	'';
	if(data.length > 0){
 		for(let i in data){

 			let subStr 	=	'';

 			if(data[i].buyer){
 				subStr 	=	`<button type="button" class="btn btn-warning sellerRevoke">${$.i18n.prop('seller_revoke')}</button><button type="button" class="btn btn-info buyerRevoke">${$.i18n.prop('buyer_revoke')}</button> <button type="button" class="btn btn-success transferName">${$.i18n.prop('transfer_name')}</button>	`
 			}else{
 				subStr 	=	`<button type="button" class="btn btn-primary" onclick="buy(${i*1 + 1},'${data[i]._id}')">${$.i18n.prop('place_order')}</button><button type="button" class="btn btn-warning sellerRevoke">${$.i18n.prop('seller_revoke')}</button>`
 			}
 			
 			trList	+=	`<tr acc="${data[i].acc}" seller="${data[i].seller}" buyer="${data[i].buyer ? data[i].buyer  : ''}" order_id="${data[i]._id}">
 				<td>${data[i].acc}</td>
 				<td>${parseFloat(data[i].price.amount).toFixed(4)}</td>
 				<td>${parseFloat(data[i].adfee.amount).toFixed(4)}</td>
 				<td>${data[i].createdat.substring(0, 10)}</td>
 				<td>${subStr}</td>
 				</tr>`;
 		}
 		

 	}
 	return trList;
}


function secondKindShow(data){
	$('.acc-name').text(data[0].acc)
	$('.sell-price').text(parseFloat(data[0].price.amount).toFixed(4))
	$('.ad-fee').text(parseFloat(data[0].adfee.amount).toFixed(4))
	$('.create-date').text(data[0].createdat.substring(0, 10))
	
	let temStr	=	'';

	if(data[0].buyer){
		temStr	=	`<div class="col-md-4">
						<button class="btn btn-warning btn-lg sellerRevoke">${$.i18n.prop('seller_revoke')}</button>
					</div>

					<div class="col-md-4">
						<button class="btn btn-info btn-lg buyerRevoke">${$.i18n.prop('buyer_revoke')}</button>
					</div>

					<div class="col-md-4">
						<button class="btn btn-success btn-lg transferName">${$.i18n.prop('transfer_name')}</button>
					</div>
					`;
		
	}else{
		temStr	=	`<div class="col-md-6">
						<button class="btn btn-primary btn-lg" onclick="buy(1, 1)">${$.i18n.prop('place_order')}</button>
					</div>

					<div class="col-md-6">
						<button class="btn btn-warning btn-lg sellerRevoke">${$.i18n.prop('seller_revoke')}</button>
					</div>`;
	}

	$('.sell-search-button-list').html(`<div id = 'buyer-id' the-seller='${data[0].seller}' the-id='${data[0].buyer}' style='display:none;'></div>` + temStr)
}

async function loginScatter(){
	scatter.getIdentity({ accounts:[network] }).then(async identity=>
		{
			let account = identity.accounts.find(acc => acc.blockchain === 'eos')
			console.log(account)
			getFormatAccountInfo(account, eos)
			$('.panel-body').hide()
		},err=>{
			console.log(err)
		})
}

function GetQueryString(name)
{
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

function showListFun(offset, limit = perPage){
	$.get(`${reqListUrl}getOpenOrderList`, {'offset': offset, "limit": limit},
	   	function(data){
	   		let trList	=	constructStr(data);
	     	
	     	$('#acc_list').html(trList)

	     	if(offset == 0){
     			$('.prev').attr('disabled',true)
     		}else{
     			$('.prev').attr('disabled',false)
     		}

     		if(data.orderCount <= homeCurPageNum * perPage){
     			$('.next').attr('disabled',true)
     		}else{
     			$('.next').attr('disabled',false)
     		}

	   	}, "json");
}

$(document).ready(function(){


	setTimeout(function(){if(typeof scatter == 'undefined'){$('.scatter-warning').show();}},10000)
	setTimeout(function(){if(scatter){$('.scatter-warning').hide();}},11000)//防止页面加载缓慢导致出的bug




	//页面加载完成，初始化加载列表
	if($('#home-page').length > 0){
		showListFun(0)
	}


	if($('#search-page').length > 0){//搜索页面
		const acc = GetQueryString('acc');
		let   isHaveResult	=	false;

		const p1 = new Promise((resolve, reject) => {

			$.get(`${reqListUrl}getOrderBySeller`, {'seller':acc},
			   	function(data){

			   		if(data.length > 0 ){

				   		let trList	=	searchConstructStr(data);
				     	$('#search_acc_list').html(trList);
				     	isHaveResult	=	true;
				     	$('.first-kind').show();
				     	$('.second-kind').hide();
		     	   	}
		     	   	resolve('ok')

		   	}, "json");

		})

		const p2 = new Promise((resolve, reject) => {

			$.get(`${reqListUrl}getOrderByAcc`, {'acc':acc},
		   	function(data){

		   		if(data.length > 0 ){

			   		let trList	=	secondKindShow(data);
			     	isHaveResult	=	true;
			     	$('.first-kind').hide();
			     	$('.second-kind').show();
	     	   	}
	     	   	resolve('ok')

		   	}, "json");

		})

		Promise.all([p1, p2])
		.then(result => {
			 if(!isHaveResult){
		   	 	$('.left-container').html($.i18n.prop('not_found_related_items'))
		   	 }
		})
		.catch(e => console.log(e)); 	

	}

	$('#account-info').on('click', '.logout-scatter',function(){
		scatter.forgetIdentity();
		$('#account-info').html('')
		$('.panel-body').show()
		
	})


	$('#account-info').on('click', '.change-scatter',function(){
		scatter.forgetIdentity().then(async ()=>{
			loginScatter().then(
				(val)=>{
					console.log('val===>',val)
					if(val == undefined){
						$('#account-info').html('')
						$('.panel-body').show()
					}
				},err=>{
					console.log('err===>',err)
					$('#account-info').html('')
					$('.panel-body').show()
				})
		})
	})

	$('.login-button').click(function(){
		loginScatter()
	})

	$('.prev').click(function(){

 		if($(this).attr('disabled')){
 			return false;
 		}

 		showListFun(( homeCurPageNum - 2 ) * perPage , perPage);

		homeCurPageNum --;
	})

	$('.next').click(function(){

 		if($(this).attr('disabled')){
 			return false;
 		}

 		// $(this).attr('disabled',true)
		showListFun(homeCurPageNum * perPage , perPage);

	   	homeCurPageNum++;
	})

	$('#wechatShow span').hover(function(){
		$('#wechatShow img').show()
	},function(){
		$('#wechatShow img').hide()
	})

})


document.addEventListener('scatterLoaded',async scatterExtension => {
	
	$('.scatter-warning').hide();
    const scatter = window.scatter;

	eos = scatter.eos( network, Eos, {}, network.protocol);

	let account = '';


	scatter.authenticate()
    .then(async sig => {

        console.log('yes')

        scatter.getIdentity({ accounts:[network] }).then(async identity=>
		{
			account = identity.accounts.find(acc => acc.blockchain === 'eos')	
			console.log(account)
			getFormatAccountInfo(account, eos)
		},err=>{
			console.log(err)
		})

    },()=> {$('.panel-body').show();$('.tips_login').show();})
    .catch(err => console.log('auth error', err))


	let bidnameContract =  eos.contract(codeName);

	$('#acc-publish').click(function(){
		const sellAccName 	=	$('#sell-acc-name').val().trim();
		const receiptAccName= 	$('#receipt-acc-name').val().trim();
		const sellPrice		= 	parseFloat($('#sell-price').val().trim());
		const adFee			=	parseFloat($('#ad-fee').val().trim());
		const permission  	=	'owner';

		if(sellAccName.length > 12 || sellAccName.length < 3){
			alert($.i18n.prop('sell_acc_limit'));
			return false;
		}

		if(receiptAccName.length > 12 || receiptAccName.length < 3){
			alert($.i18n.prop('receipt_acc_limit'));
			return false;
		}

		//todo 判断卖出价格与广告费

	
		let options = {
		  authorization: sellAccName + '@' + permission,
		  broadcast: true,
		  sign: true
		};



		checkLogin(sellAccName, permission).then(async result=>{

			const input_eosaccount	=	await eos.getAccount(sellAccName);
			let isAlreadyAssign	=	false;

			for(let acc of input_eosaccount.permissions[1].required_auth.accounts){//检查卖出账户的账号是否已经赋了code权限
		    	if(acc.permission.actor === codeName && acc.permission.permission === 'eosio.code'){
		    		isAlreadyAssign	=	true;
		    		break;
		    	}
	   		}

	   		if(!isAlreadyAssign){
	   			try{
		   			const isAllowAssign = await window.confirm($.i18n.prop('need_code_permission', sellAccName))
		   			if(isAllowAssign){
		   				await assignOrCancelCodePer(sellAccName, 'assign', permission, input_eosaccount) 
		   				await getFormatAccountInfo({'name':sellAccName, 'authority':permission})
		   			}else{
		   				alert($.i18n.prop('you_reject_auth_stop'))
		   				return false;
		   			}

	   			}catch(e){
	   				console.log(e)
	   				return false;
	   			}
	   		}

	   		bidnameContract.then(obj => {
				obj.createorder(receiptAccName, sellAccName, sellPrice.toFixed(4) + ' EOS',adFee.toFixed(4) + ' EOS', options).then(val=>{
					console.log("i am good!!!",val)
					alert($.i18n.prop('put_order_success'))
				},err =>{

					if(typeof err == 'object'){
		      			if(err.type === 'signature_rejected'){
		      				alert($.i18n.prop('you_reject_put_order_failed'))
			      		}else{
			      			alert($.i18n.prop('put_order_fail_detail', err.code, err.message))
			      		}
		      		}else{
			      		const errObj	=	JSON.parse(err);
				      	const code 		=	errObj.error.code;
				      	alert($.i18n.prop('put_order_fail_detail_kind2', code, errObj.error.what, errObj.error.details[0].message))
				      	
						
						console.log(errObj.error.what)
						console.log(errObj.error.details[0].message)
			      	}
				})
			})

   	},err =>
        alert(err)
	)


			
	})




$('#sub').click(async function(){
	const accountName 	=	$('#account-name').text().trim();
	const publicKey 	=	$('input[name="public-key"]').val().trim();
	const orderId		=	$('input[name="order-id"]').val().trim();
	const buyerAccName	=	$('input[name="buyer-acc-name"]').val().trim();
	const permission 	=	'active';
	const reg1			=	new RegExp(/EOS[A-Za-z0-9]{49,49}/)
	

	const eos = scatter.eos( network, Eos, {}, network.protocol);

	if(! reg1.test(publicKey)){
		alert($.i18n.prop('public_key_format_err'))
		return false;
	}
	

	let options = {
		  authorization: buyerAccName + '@active',
		  broadcast: true,
		  sign: true
		};


	checkLogin(buyerAccName, permission).then(async result=>{

		const input_eosaccount	=	await eos.getAccount(buyerAccName);
		let isAlreadyAssign	=	false;

		for(let acc of input_eosaccount.permissions[0].required_auth.accounts){//检查购买账户的账号是否已经赋了code权限
	    	if(acc.permission.actor === codeName && acc.permission.permission === 'eosio.code'){
	    		isAlreadyAssign	=	true;
	    		break;
	    	}
   		}

   		if(!isAlreadyAssign){
   			try{
	   			const isAllowAssign = await window.confirm($.i18n.prop('need_code_permission' ,buyerAccName))
	   			if(isAllowAssign){
	   				await assignOrCancelCodePer(buyerAccName, 'assign', permission, input_eosaccount) 
	   				await getFormatAccountInfo({'name':buyerAccName, 'authority':permission})
	   			}else{
	   				alert($.i18n.prop('you_reject_auth_stop'))
	   				return false;
	   			}

   			}catch(e){
   				console.log(e)
   				return false;
   			}
   		}

   		bidnameContract.then(obj => {
			obj.placeorder(accountName, buyerAccName, publicKey,options).then(val=>{
			console.log(val) 
			$('#buy-modal').hide()
			showListFun((homeCurPageNum - 1) * perPage)
			alert($.i18n.prop('purchase_success_info'))
			},err =>{

				if(typeof err == 'object'){
	      			if(err.type === 'signature_rejected'){
	      				alert($.i18n.prop('reject_purchase_failed'))
		      		}else{
		      			alert($.i18n.prop('purchase_failed_detail', err.code, err.message))
		      		}
	      		}else{
		      		const errObj	=	JSON.parse(err);
			      	const code 		=	errObj.error.code;
			      	alert($.i18n.prop('purchase_failed_detail_kind2', code, errObj.error.what, errObj.error.details[0].message))
			      	
					
					console.log(errObj.error.what)
					console.log(errObj.error.details[0].message)
		      	}
			})
		})

   	},err =>
        alert(err)
	)



	
})

/************首页  end*************/


/************搜索  begin*****************/

//卖家撤单
$('.left-container').on('click','.sellerRevoke',async function(){
	let accountName, orderId, buyer, seller
	let permission 		=	'owner';

	if($('.second-kind').css('display') === 'none'){
		const t 		= 	$(this).parents('tr');
		accountName 	=	t.attr('acc');
		orderId 		=	t.attr('order_id');
		buyer 			=	t.attr('buyer');
		seller 			=	t.attr('seller');
		
	}else{
		accountName 	=	$('.acc-name').text()
		buyer 			=	$('#buyer-id').attr('the-id')
		seller 			=	$('#buyer-id').attr('the-seller')
	}
	

	let options = {
	  authorization: accountName + '@' + permission,
	  broadcast: true,
	  sign: true
	};

	

	if(window.confirm($.i18n.prop('are_you_sure_cancel_order'))){
		checkLogin(accountName, permission).then(res=>{

			bidnameContract.then(obj => {
				console.log('accountName:',accountName,'--seller--',seller)
				obj.cancelorder(accountName, seller, options).then(val=>{
				console.log(val) 
				alert($.i18n.prop('cancel_order_success'))
				},err =>{

					if(typeof err == 'object'){
		      			if(err.type === 'signature_rejected'){
		      				alert($.i18n.prop('reject_seller_revoke_failed'))
			      		}else{
			      			alert($.i18n.prop('seller_revoke_failed' , code, err.message))
			      		}
		      		}else{
			      		const errObj	=	JSON.parse(err);
				      	const code 		=	errObj.error.code;
				      	alert($.i18n.prop('seller_revoke_failed_detail', code, errObj.error.what, errObj.error.details[0].message))
				      	
						
						console.log(errObj.error.what)
						console.log(errObj.error.details[0].message)
			      	}
					
				})
			})
		},err=>{
			alert(err)

		})

		
	}

})

//买家撤单
$('.left-container').on('click','.buyerRevoke',function(){

	let accountName, orderId, buyer, seller
	let permission 		=	'active';

	if($('.second-kind').css('display') === 'none'){
		const t 		= 	$(this).parents('tr');
		accountName 	=	t.attr('acc');
		orderId 		=	t.attr('order_id');
		buyer 			=	t.attr('buyer');
		seller 			=	t.attr('seller');
		
	}else{
		accountName 	=	$('.acc-name').text()
		buyer 			=	$('#buyer-id').attr('the-id')
		seller 			=	$('#buyer-id').attr('the-seller')
	}
	

	let options = {
	  authorization: buyer + '@' + permission,
	  broadcast: true,
	  sign: true
	};


	if(window.confirm($.i18n.prop('are_you_sure_cancel_order'))){

		checkLogin(buyer, permission).then(res=>{

			bidnameContract.then(obj => {
				console.log('accountName:',accountName,'--buyer:',buyer,'--seller:',seller)
				obj.cancelplace(accountName, buyer, seller, options).then(val=>{
					console.log(val) 
					alert($.i18n.prop('cancel_order_success'))
				},err =>{
					if(typeof err == 'object'){
		      			if(err.type === 'signature_rejected'){
		      				alert($.i18n.prop('reject_buyer_revoke_failed'))
			      		}else{
			      			alert($.i18n.prop('buyer_revoke_failed', err.code, err.message))
			      		}
		      		}else{
			      		const errObj	=	JSON.parse(err);
				      	const code 		=	errObj.error.code;
				      	alert($.i18n.prop('buyer_revoke_failed_detail', code, errObj.error.what, errObj.error.details[0].message) )
				      	
						
						console.log(errObj.error.what)
						console.log(errObj.error.details[0].message)
			      	}
				})

			})

		},err=>{
			alert(err)

		})

		
	}




})



//过户

$('.left-container').on('click','.transferName', async function(){
	let accountName, orderId, buyer, seller
	let permission 		=	'owner';

	if($('.second-kind').css('display') === 'none'){
		const t 		= 	$(this).parents('tr');
		accountName 	=	t.attr('acc');
		orderId 		=	t.attr('order_id');
		buyer 			=	t.attr('buyer');
		seller 			=	t.attr('seller');
		
	}else{
		accountName 	=	$('.acc-name').text()
		buyer 			=	$('#buyer-id').attr('the-id')
		seller 			=	$('#buyer-id').attr('the-seller')
	}
	

	let options = {
	  authorization: accountName + '@' + permission,
	  broadcast: true,
	  sign: true
	};

	
	checkLogin(accountName, permission).then(async result=>{

		const input_eosaccount	=	await eos.getAccount(accountName);
		let isAlreadyAssign	=	false;

		for(let acc of input_eosaccount.permissions[1].required_auth.accounts){//检查购买账户的账号是否已经赋了code权限
	    	if(acc.permission.actor === codeName && acc.permission.permission === 'eosio.code'){
	    		isAlreadyAssign	=	true;
	    		break;
	    	}
   		}

   		if(!isAlreadyAssign){
   			try{
	   			const isAllowAssign = await window.confirm($.i18n.prop('need_code_permission', accountName))
	   			if(isAllowAssign){
	   				await assignOrCancelCodePer(accountName, 'assign', permission, input_eosaccount) 
	   				await getFormatAccountInfo({'name':accountName, 'authority':permission})
	   			}else{
	   				alert($.i18n.prop('you_reject_auth_stop'))
	   				return false;
	   			}

   			}catch(e){
   				console.log(e)
   				return false;
   			}
   		}

   		bidnameContract.then(obj => {
			obj.accrelease(seller, accountName, buyer, options).then(val=>{
			console.log(val) 
			alert($.i18n.prop('tranfer_name_success'))
			},err =>{

				if(typeof err == 'object'){
	      			if(err.type === 'signature_rejected'){
	      				alert($.i18n.prop('reject_transfer_name_fail'))
		      		}else{
		      			alert($.i18n.prop('transfer_name_failed_detail', err.code, err.message))
		      		}
	      		}else{
		      		const errObj	=	JSON.parse(err);
			      	const code 		=	errObj.error.code;
			      	alert($.i18n.prop('transfer_name_failed_detail_kind2', code, errObj.error.what, errObj.error.details[0].message))
			      	
					
					console.log(errObj.error.what)
					console.log(errObj.error.details[0].message)
		      	}
			})
		})

   	},err =>
        alert(err)
	)


})





/************搜索  end  *****************/


})