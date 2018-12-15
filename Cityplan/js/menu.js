/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：菜单栏相关方法
 * 注意事项：存放header一级菜单栏相关方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 */

var lastClickId = null;//上一次点击的菜单ID
var tagArr = [];//一级菜单tag数组

/**
 * 菜单禁用
 * @param  {Boolean} isDisable [是否禁用]
 * @return {[type]}            [description]
 */
function disableAll(isDisable){
    $("#DB_navi").attr("disabled",isDisable);
    $(".topImg").attr("disabled",isDisable);
}

/**
 * 菜单初始化
 * @return {[type]} [description]
 */
function initMenu(){
    for(var i = 0; i < lefts.config.menu.length;i++){
        tagArr.push(lefts.config.menu[i].tag);
    }
    var minTag = Math.min.apply(null,tagArr);
    var menuHtml = getMenusHtml();
    $("#DB_ul").html(menuHtml);

    lastClickId = $(".topLi[tagIndex=" + minTag + "]").attr("id");
    $("#"+lastClickId + " img").attr("src","images/top/activeIcons/"+lastClickId+".png");
    getTableObjectById(minTag);//加载指定tag的菜单项
}

/**
 * 获取所有一级菜单html字符串
 * @return {[type]} [description]
 */
function getMenusHtml(){
    var menuHtml = "";
    for(var i = lefts.config.menu.length-1; i >= 0 ; i--){
        var item = lefts.config.menu[i];
        menuHtml += '<li tagIndex="' + item.tag + '" id="' + item.id + '" class="topLi"><img id="' + item.id + 'Img" tagIndex="' + item.tag + '" class="topImg" src="' + item.src + '" alt="' + item.name + '" /></li>';
    }
    var ulWidth = lefts.config.menu.length*85;
    $("#DB_ul").width(ulWidth);

    return menuHtml;
}

$(document).ready(function(){
    var DB_navi = document.getElementById("DB_navi");
    var DB_ul = document.getElementById("DB_ul");
    $("#DB_navi").click(function(e){//一级菜单点击事件
        if($("#DB_navi").attr("disabled") == true || $("#DB_navi").attr("disabled") == "disabled"){
            return;
        }
        var ev = null;
        if(e){
            ev = e.target;
        }else{
            ev = window.event.srcElement;
        }
        var id = ev.getAttribute("tagIndex");
        if(id == undefined){
            return;
        }

        id = parseInt(id);

        if(!isNaN(id)){
            var thisId = ev.id;
            var imgIndex = thisId.indexOf("Img");
            if(imgIndex>0){
                imgId = thisId.substr(0,thisId.lastIndexOf("Img"));
            }else{
                imgId = $("#"+thisId)[0].id;
            }
            $("#"+lastClickId + " img").attr("src","images/top/inactiveIcons/"+lastClickId+".png");
            lastClickId = imgId;
            $("#"+imgId + " img").attr("src","images/top/activeIcons/"+imgId+".png");
            getTableObjectById(id);//二级菜单根据一级菜单tagIndex点击事件

            approveDisableState(top.projectState);
            aidedPlanDisableState();
        }else{
            return;
        }
    });
});