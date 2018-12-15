/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：针对左侧面板的方法
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var dialogId = null;//此时点击打开dialog的二级菜单id
var bLayerVisible = true;//图层管理是否可见
/**
 * 打开左侧面板
 * @param {[string]} src [要打开的面板的html路径]
 * @param {[string]} clickId [被点击的二级菜单的id]
 */
window.showDialog = function (src, clickId) {
    LayerManagement.clearSearchResult();//清除查询或者分析等图层的结果，不然会占用内存
    //如果再次点击该二级菜单则关闭面板,但是由于属性信息也是显示在左侧面板，所以如果是属性查询则不会关闭面板
    if (clickId && clickId == dialogId && clickId != "QueryProperty") {
        closeDialog();
        return;
    }
    if (dialogId) {
        Tools.singleStyleCancel(dialogId);//清除上一次点击的二级菜单的样式
    }
    Tools.singleSelectedStyle(clickId);//给现在的加上样式
    dialogId = clickId;

    LayerManagement.clearHtmlBalloons();
    if ($("#leftPanel").is(":hidden")) {//如果左侧面板是隐藏的，则需要先显示左侧面板
        setLayerShow(true);//显示左侧面板
        bLayerVisible = false;
    }
    var title = "";
    var titleImg = "";
    for (var i = 0; i < cpPs.config.menu.length; i++) {
        for (var j = 0; j < cpPs.config.menu[i].item.length; j++) {
            if (cpPs.config.menu[i].item[j].id == clickId) {
                title = cpPs.config.menu[i].item[j].title;
                titleImg = cpPs.config.menu[i].item[j].src;
                break;
            }
        }
    }
    if (clickId == "QueryProperty") {//属性查询
        title = "属性查询";
        titleImg = "images/tools/QueryProperty.png";
    }
    $("#id_left_operator").show();
    $("#id_left_operator").dialog({
        shadow: false,
        draggable: false,
        title: title,
        titleImg: titleImg,//在面板的顶部显示其图片
        onClose: function () {
            if (!bLayerVisible) {
                setLayerShow(false);//隐藏左侧面板
            }
            $("#id_left_operator").hide();
            $("#operator").attr("src", "");
            LayerManagement.clearHtmlBalloons();//关闭面板的时候关闭双击产生的相信信息气泡
            LayerManagement.clearSearchResult();//清除查询或者分析等图层的结果，不然会占用内存
            Tools.singleStyleCancel(dialogId);
            dialogId = null;
            if (!bLayerVisible) {
                setLayerShow(false);
            }
        }
    }).panel({
        height: $(document).height() - 70,//左侧面板高度
        width: 255
    }).panel("move", {
        top: "70px",
        left: "0px"
    });

    $("#id_left_operator").show();
    $("#operator").attr("src", src);
};
/**
 * 关闭左侧面板
 */
function closeDialog() {
    if ($("#id_left_operator").css("display") != "none") {
        $("#id_left_operator").hide();
        $("#id_left_operator").dialog('close');
        Tools.singleStyleCancel(dialogId);//去除点击样式
        dialogId = null;
    }
}