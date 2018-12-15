/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：三级菜单
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
window.onload = function() {
    setMenuData();
}

document.oncontextmenu = function() { //右键屏蔽方法
    event.returnValue = false;
}
// 三级菜单
function setMenuData() {
    var menuCon = top.menuItem;
    if(menuCon==undefined){
        return;
    }

    var divStr = "";
    for (var i = 0; i < menuCon.item.length; i++) {
        var menuObj = menuCon.item[i];
        var imgSrc = "../../" + menuObj.src;
        var imgSrcd = "../../" + menuObj.srcd;
        if ((i + 1) % 3 == 1){
            if(i!=0){
                divStr += '</div>';
            }
            divStr += '<div class="menu-line"><div class="menu-item-first">';
        }else {
            divStr += '<div class="menu-item">';
        }

        divStr += '<img id="' + menuObj.id + '" src="' + imgSrc + '" onclick=\'clickMenuItem("' + menuObj.id + '","' + imgSrc + '","' + imgSrcd + '")\'/><span>' + menuObj.name + '</span></div>';
        if((i+1)%3==0 || i==menuCon.item.length-1){
            divStr += '</div>';
        }
    }
    $("#div_submenu").html(divStr);
    $("#markedTreeDiv").height($(this).height()-$("#paramSetInner").height()-70);
    $("#markedTreeDiv").mCustomScrollbar({});
    initMarkedMgr();
}

var lastId = null;
var lastSrc = "";
// 添加点击事件
function clickMenuItem(id,imgSrc,imgSrcd) {
    if(lastId!=null)
    {
        $("#"+lastId).attr("src",lastSrc);
    }
    lastId = id;
    lastSrc = imgSrc;
    $("#" + id).attr("src",imgSrcd);
    try{
        top.window[id+"Clicked"](id);
    }catch (e){
        alert("请先定义" + id + "Clicked()方法");
    }
}