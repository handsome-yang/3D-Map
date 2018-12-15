/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：一级菜单：菜单功能方法
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

var lastClickId = ""; //最后点击对象的id
var tagArr = []; //标签数组


/**
 * 初始化菜单
 */
function initMenu() {
	for(var i = 0; i < STAMP.menuConfig.menu.length; i++) {
		tagArr.push(STAMP.menuConfig.menu[i].tag);
	}
	var minTag = Math.min.apply(null, tagArr);
	var menuHtml = getMenusHtml();
	$("#DB_ul").html(menuHtml);

	lastClickId = $(".topLi[tagIndex=" + minTag + "]").attr("id");
	$("#" + lastClickId + " img").attr("src", "images/top/activeIcons/" + lastClickId + ".svg");
	getTableObjectById(minTag);
}

/**
 * 获取菜单HTML
 */
function getMenusHtml() {
	var menuHtml = "";
	for(var i = STAMP.menuConfig.menu.length - 1; i >= 0; i--) {
		var item = STAMP.menuConfig.menu[i];
		menuHtml += '<li tagIndex="' + parseInt(item.tag) + '" id="' + item.id + '" class="topLi"><img id="' + item.id + 'Img" tagIndex="' + parseInt(item.tag) + '" class="topImg" src="' + item.src + '" alt="' + item.name + '" /><p>'+item.name+'</p></li>';
	}
	var ulWidth = STAMP.menuConfig.menu.length * 100;
	$("#DB_ul").width(ulWidth)
	return menuHtml;
}

//菜单禁用
function disableAll(isDisable) {
	$("#DB_navi").attr("disabled", isDisable);
	$(".topImg").attr("disabled", isDisable);
}

/**
 * 页面加载完成事件
 */
$(document).ready(function() {
	var DB_navi = document.getElementById("DB_navi"); //右侧一级菜单div
	var DB_ul = document.getElementById("DB_ul"); //右侧一级菜单ul
	$("#DB_navi").click(function(e) { //一级菜单点击事件
		if($("#DB_navi").attr("disabled") == true || $("#DB_navi").attr("disabled") == "disabled") {
			return;
		}
		var ev = null;
		if(e) {
			ev = e.target;
		} else {
			ev = window.event.srcElement;
		}
		var id = ev.getAttribute("tagIndex");

		if(id == undefined) {
			return;
		}

		id = parseInt(id);

		if(!isNaN(id)) {
			var thisId = ev.id;
			var imgIndex = thisId.indexOf("Img");
			if(imgIndex > 0) {
				imgId = thisId.substr(0, thisId.lastIndexOf("Img"));
			} else {
				imgId = $("#" + thisId)[0].id;
			}
			$("#" + lastClickId + " img").attr("src", "images/top/inactiveIcons/" + lastClickId + ".svg");
			lastClickId = imgId;
			$("#" + imgId + " img").attr("src", "images/top/activeIcons/" + imgId + ".svg");
			top.getTableObjectById(id); //二级菜单根据一级菜单点击事件
		} else {
			return;
		}
	});

});