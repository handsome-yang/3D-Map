/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：工具栏气泡内部页面的方法
 * 注意事项：只用于工具栏气泡内部页面中的方法
 * 遗留bug ：工具栏高度自适应还存着问题，当上下翻页按钮出现后，直接最大化按钮，工具栏高度没有随窗体大小改变
 * 修改日期：2017年11月8日
 */
var earthToolHeight = 0;
/**
 * 外部传参-入口方法
 * @param {[object]} tparams [外部传入气泡的参数]
 */
function setFunc(tparams) {
    //获取外部传入参数
    var clickItem = tparams.clickItem;
    var updateEarthToolsDiv = tparams.updateEarthToolsDiv;
    earthToolHeight = tparams.earthToolHeight;//工具栏高度，用于自适应

    //菜单点击事件
    $(".toolItem").click(function(){
        clickItem($(this).attr("id"), $("#earthTools"));
    });

    updateEarthToolsDiv($("#earthTools"));//回调，将内部页面html节点对象传到外面，供外面直接修改内部的节点信息
    resizeWindow();
}

function resizeWindow(){
    if($(window).height() < earthToolHeight){
        if($("#prevBtn").is(":hidden")){
            $("#nextBtn").show();
        }
        $("#earthTools").css("margin-bottom", "22px");
    }else{
        $("#prevBtn").hide();
        $("#nextBtn").hide();
        $("#earthTools").css("margin-bottom", "0px");
        document.documentElement.scrollTop = 0;
    }
}

//气泡窗口大小调整事件
window.onresize = function(){
    resizeWindow();
}

//上一页按钮事件
$("#nextBtn").click(function(){
    var scrollHeight = $(window).height() - 22;
    var scrollTopNow = document.documentElement.scrollTop;
    var scrollTopNext = scrollTopNow + scrollHeight;
    $("html,body").animate({scrollTop:scrollTopNext + 'px'},500);
    if(scrollTopNext + $(window).height() >= $("#earthTools").height()){
        $("#nextBtn").hide();
        $("#prevBtn").show();
    }
});

//下一页按钮事件
$("#prevBtn").click(function(){
    var scrollHeight = $(window).height() - 22;
    var scrollTopNow = document.documentElement.scrollTop;
    var scrollTopNext = scrollTopNow - scrollHeight;
    if(scrollTopNext<=0){
        scrollTopNext = 0;
        $("#prevBtn").hide();
        $("#nextBtn").show();
    }
    $("html,body").animate({scrollTop:scrollTopNext + 'px'},500);
});
