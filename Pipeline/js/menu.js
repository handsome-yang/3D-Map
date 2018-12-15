/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：一级菜单的一些方法
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var lastClickId = "";//上一次点击的以及菜单的id
var tagArr = [];//一级菜单的tag集合

/**
 * 一级菜单禁用
 * @param {[Boolean]} isDisable [true:禁用,false:启用]
 */
function disableAll(isDisable) {
    $("#DB_navi").attr("disabled", isDisable);
    $(".topImg").attr("disabled", isDisable);
}

/**
 * 初始化一级菜单
 */
function initMenu() {
    for (var i = 0; i < cpPs.config.menu.length; i++) {
        tagArr.push(cpPs.config.menu[i].tag);
    }
    var minTag = Math.min.apply(null, tagArr);
    var menuHtml = getMenusHtml();
    $("#DB_ul").html(menuHtml);
    lastClickId = $(".topLi[tagIndex=" + minTag + "]").attr("id");
    $("#" + lastClickId + " img").attr("src", "images/top/activeIcons/" + lastClickId + ".png");//将第一个菜单设置为点击状态
    getTableObjectById(minTag);
}
/**
 * 构成一级菜单html字符串
 * @returns {string} html字符串
 */
function getMenusHtml() {
    var menuHtml = "";
    for (var i = cpPs.config.menu.length - 1; i >= 0; i--) {
        var item = cpPs.config.menu[i];
        menuHtml += '<li tagIndex="' + parseInt(item.tag) + '" id="' + item.id + '" class="topLi"><img id="' + item.id + 'Img" tagIndex="' + parseInt(item.tag) + '" class="topImg" src="' + item.src + '" alt="' + item.name + '" /></li>';
    }
    var ulWidth = cpPs.config.menu.length * 85;//根据一级菜单的个数来确定一级菜单div的宽度
    $("#DB_navi").width(ulWidth);
    return menuHtml;

}

$(document).ready(function () {
    var DB_navi = document.getElementById("DB_navi");
    var DB_ul = document.getElementById("DB_ul");
    $("#DB_navi").click(function (e) {//一级菜单点击事件的时间代理
        if ($("#DB_navi").attr("disabled") == true || $("#DB_navi").attr("disabled") == "disabled") {
            return;
        }
        var ev = null;
        if (e) {//为了兼容浏览器，所以要这样写
            ev = e.target;
        } else {
            ev = window.event.srcElement;
        }
        var id = ev.getAttribute("tagIndex");
        id = parseInt(id);

        if (!isNaN(id)) {
            var thisId = ev.id;
            var imgIndex = thisId.indexOf("Img");
            if (imgIndex > 0) {
                imgId = thisId.substr(0, thisId.lastIndexOf("Img"));
            } else {
                imgId = $("#" + thisId)[0].id;
            }
            $("#" + lastClickId + " img").attr("src", "images/top/inactiveIcons/" + lastClickId + ".png");
            lastClickId = imgId;
            $("#" + imgId + " img").attr("src", "images/top/activeIcons/" + imgId + ".png");
            top.getTableObjectById(id);//二级菜单根据一级菜单点击事件
        } else {
            return;
        }
    });
});
	
	
