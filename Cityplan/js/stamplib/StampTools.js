/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：常用工具方法对象
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var Stamp = new Object();
var htmlBalloons = null;
Stamp.Tools = {
    Earth: null,
    picturesBalloons: null,
    htmlBalloonMove: null,
    showMode: 'standard', //管线显示模式
    bTerrain: true, //忽略地形
    balloonsFunc: new ActiveXObject("Scripting.Dictionary"),
    /**
     * 气泡关闭回调
     * @param {[type]}   curBid   [气泡ID]
     * @param {Function} callback [回调]
     */
    OnHtmlBalloonFinishedFunc: function (curBid, callback) { //全局OnHtmlBalloonFinished事件
        Stamp.Tools.balloonsFunc.item(curBid) = callback;
        Stamp.Tools.Earth.event.OnHtmlBalloonFinished = function (closeBid) {
            if (Stamp.Tools.balloonsFunc.Exists(closeBid)) {
                Stamp.Tools.balloonsFunc.item(closeBid)(closeBid);
                Stamp.Tools.balloonsFunc.Remove(closeBid);
                top.Tools.singleStyleCancel("ScreenShot");
            }
        }
    },
    UndergroundMode: function (id) { //地下浏览
        var flag = BalloonHtml.itemClickStyle(id);
        if (flag) {
            Stamp.Tools.Earth.GlobeObserver.UndergroundMode = true; // 地下浏览模式
        } else {
            Stamp.Tools.Earth.GlobeObserver.UndergroundMode = false; // 取消地下浏览模式
            Stamp.Tools.Earth.Event.OnObserverChanged = function () {
            };
        }
    },
    picrureHtml: function (id, surl, flag) { //截屏,出图
        if (Stamp.Tools.picturesBalloons != null) {
            Stamp.Tools.picturesBalloons.DestroyObject(); //删除气泡
            Stamp.Tools.picturesBalloons = null;
        }
        if (!flag) {
            return;
        }
        var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
        var width = 280,
            height = 500;
        if (id == "Coordinate") {
            width = 234;
            height = 180;
        } else if (id == "screenShot") {
            width = 335;
            height = 260;
        } else if (id == "pictures") {
            height = 395;
            width = 413;
        }
        var url = loaclUrl + surl;
        var dval = this.Earth;

        var locationX = top.dialogLeft + width/2;
        Stamp.Tools.picturesBalloons = Stamp.Tools.Earth.Factory.CreateHtmlBalloon(Stamp.Tools.Earth.Factory.CreateGuid(), "");
        Stamp.Tools.picturesBalloons.SetScreenLocation(locationX, 0);
        Stamp.Tools.picturesBalloons.SetRectSize(width, height);
        Stamp.Tools.picturesBalloons.SetIsAddBackgroundImage(false);

        var flag = top.Tools.toolBarItemClickStyle("ScreenShot");
        if (flag) {
            Stamp.Tools.picturesBalloons.ShowNavigate(url);
            Stamp.Tools.Earth.Event.OnDocumentReadyCompleted = function (guid) { //针对气泡ShowNavigate的网页加载完成事件
                if (Stamp.Tools.picturesBalloons === null) {
                    return;
                }
                dval.htmlBallon = Stamp.Tools.picturesBalloons;
                dval.pipeDatum = top.SYSTEMPARAMS.pipeDatum;
                dval.Tools = Tools;
                if (Stamp.Tools.picturesBalloons.Guid == guid) {
                    Stamp.Tools.picturesBalloons.InvokeScript("setTranScroll", dval);
                }
            };

        }
        Stamp.Tools.OnHtmlBalloonFinishedFunc(Stamp.Tools.picturesBalloons.Guid, function (id) {
            if (Stamp.Tools.picturesBalloons != null && id === Stamp.Tools.picturesBalloons.Guid) {
                Tools.groupItemSelected("no", 4);
                Stamp.Tools.picturesBalloons.DestroyObject(); //删除气泡
                Stamp.Tools.Earth.ToolManager.SphericalObjectEditTool.Browse(); //退出编辑工具，继续浏览
                Stamp.Tools.picturesBalloons = null;
            }
        });
    },
    ViewTranSetting: function (id) { //地形透明
        var flag = BalloonHtml.itemClickStyle(id);
        if (flag) {
            setSlidersVisible(1);
        } else {
            setSlidersVisible(0);
        }
    },
    Hawkeye2D: function (id) { // 鹰眼图
        var flag = top.Tools.toolBarItemClickStyle(id);
        if (!flag) {
            Hawkeye2DBtn = false;
            this.Earth.Environment.Thumbnail = false;
        } else {
            Hawkeye2DBtn = true;
            this.Earth.Environment.Thumbnail = true;
        }
    },
    refersToNorth: function () { // 指北
        Stamp.Tools.Earth.GlobeObserver.NorthView();
    },
    refersToTop: function () { // 顶视
        Stamp.Tools.Earth.GlobeObserver.TopView();
    }
}

/**
 * 控制是否显示Slider
 * @param {[type]} flag [description]
 */
function setSlidersVisible(flag) {
    flag > 0 ? ViewTranSettingBtn = true : ViewTranSettingBtn = false;
    var st = [{
        id: 'ViewTranSetting',
        type: 'transparency'
    }, {
        id: 'EffectRain',
        type: 'rain'
    }, {
        id: 'EffectSnow',
        type: 'snow'
    }, {
        id: 'EffectFog',
        type: 'fog'
    }];

    sliderMgr.init(Stamp.Tools.Earth, false, function (type) {
        for (var i in st) {
            if (st[i].type == type) {
                top.Tools.groupItemCancel(st[i].id);
                if (type == "transparency") {
                    ViewTranSettingBtn = false;
                    BalloonHtml.removeItemStyle(st[i].id);
                }
            }
        }
    });

    for (var i = 0; i < st.length; i++) {
        sliderMgr.setVisible(st[i].type, flag & Math.pow(2, i));
    }
};
