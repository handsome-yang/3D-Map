/*
 *管线相关功能方法-封装成对象
 */
var Stamp = new Object();
var htmlBalloons = null;

//封装方法：管线功能方法
Stamp.Tools = {
    Earth: null,
    htmlBalloonMove: null,
    htmlBalloonMoveHidden: false,
    showMode: 'material',//管线显示模式
    balloonsFunc: new ActiveXObject("Scripting.Dictionary"),
    ifShowLegend: false,
    legendGuid: null,
    lastSecond: 0,
    lastBalloonId: null,//上一个点击的气泡产生的id

    OnHtmlBalloonFinishedFunc: function (curBid, callback) {//全局OnHtmlBalloonFinished事件
        Stamp.Tools.balloonsFunc.item(curBid) = callback;
        Stamp.Tools.Earth.event.OnHtmlBalloonFinished = function (closeBid) {
            if (Stamp.Tools.balloonsFunc.Exists(closeBid)) {
                Stamp.Tools.balloonsFunc.item(closeBid)(closeBid);
                Stamp.Tools.balloonsFunc.Remove(closeBid);
                top.Tools.singleStyleCancel("ScreenShot");
            }
        }
    },
    /**
     * 地形透明点击数hijack
     * @param {[Boolean]} flag [true:打开地形透明,false:关闭地形透明]
     */
    ViewTranSetting: function (flag) {
        sliderMgr.init(Stamp.Tools.Earth);
        if (flag) {
            clearLastMeasureResult();
            setSlidersVisible(1);
        } else {
            setSlidersVisible(0);
        }
    },
    /**
     * 指北
     */
    refersToNorth: function () {
        Stamp.Tools.Earth.GlobeObserver.NorthView();
    },
    /**
     * 材质显示
     */
    materialShowing: function () {
        Stamp.Tools.showMode = "material";
        for (var i = 0; i < LayerManagement.PIPELINELAYERS.length; i++) {
            this.Earth.LayerManager.ResetMaterial(LayerManagement.PIPELINELAYERS[i].id);
        }
        if (Stamp.Tools.ifShowLegend) {//如果图例是开启的那么切换图例
            this.legendShowing();
        }
    },
    /**
     * 自定义颜色显示
     */
    customColorShowing: function () {
        var pipeRecordsArrayList = [];
        Stamp.Tools.showMode = "custom";
        for (var i = 0; i < LayerManagement.PIPELINELAYERS.length; i++) {
            var customColor = LayerManagement.PIPELINELAYERS[i].customColor;
            var id = LayerManagement.PIPELINELAYERS[i].id;
            this.Earth.LayerManager.SetColor(id, customColor);
            pipeRecordsArrayList.push(id.toString() + "," + customColor)
        }
        if (Stamp.Tools.ifShowLegend) {//如果图例是开启的那么切换图例
            this.legendShowing();
        }

    },
    /**
     *清除图例气泡
     */
    clearLegendHtmlBalloon: function () {
        if (this.legendHtmlBalloons != null) {
            this.legendHtmlBalloons.DestroyObject();
            this.legendHtmlBalloons = null;
        }
    },
    /**
     *显示图例气泡
     */
    legendShow: function (htmlStr, Height) {
        Stamp.Tools.ifShowLegend = true;
        this.clearLegendHtmlBalloon();
        var height = (parseInt(parseInt(Height) / 2)) * 25 + 160;
        var width = 380;
        Stamp.Tools.legendGuid = this.Earth.Factory.CreateGuid();
        this.legendHtmlBalloons = this.Earth.Factory.CreateHtmlBalloon(Stamp.Tools.legendGuid, "图例显示");
        this.legendHtmlBalloons.SetScreenLocation(width / 2 + top.dialogLeft, 0);
        this.legendHtmlBalloons.SetRectSize(width, height);
        this.legendHtmlBalloons.SetIsAddCloseButton(true);
        this.legendHtmlBalloons.SetIsAddMargin(true);
        this.legendHtmlBalloons.ShowHtml(htmlStr);
        this.Earth.event.OnHtmlBalloonFinished = function (id) {
            if (id == Stamp.Tools.legendGuid) {
                Stamp.Tools.ifShowLegend = false;
                if(this.legendHtmlBalloons){
                    this.legendHtmlBalloons.DestroyObject();
                    this.legendHtmlBalloons = null;
                }
                Tools.singleStyleCancel("ViewLegendShowing");
            }
        };
    },
    /**
     *显示图例
     */
    legendShowing: function (id) {
        var flag = Tools.toolBarItemClickStyle(id);
        if(!flag){
            if(this.legendHtmlBalloons){
                this.legendHtmlBalloons.DestroyObject();
                this.legendHtmlBalloons = null;
            }
            return;
        }
        if (flag) {
            if (Stamp.Tools.showMode === "material") {//材质显示通过图层调用接口获取纹理图片
                var m = 0;
                var temp = "<div id='content' style='width:100%;height:100%;overflow:auto;background:#eef5fd;'>";
                var projectId = SYSTEMPARAMS.project;
                var proLayer = this.Earth.LayerManager.GetLayerByGUID(projectId);
                var pipelineArr = LayerManagement.getPipeListByLayer(proLayer);

                for (var i = 0; i < pipelineArr.length; i++) {
                    var pipeline = pipelineArr[i];
                    var pipelineGuid = pipeline.id;
                    var layer = this.Earth.LayerManager.GetLayerByGUID(pipelineGuid);
                    var layerGuid = layer.Guid;
                    var a = this.Earth.LayerManager.GetBlockLayerTextureNum(pipelineGuid);
                    if (a === 0) {
                        continue;
                    }
                    var imgPath = this.Earth.LayerManager.GetBlockLayerSymbol(pipelineGuid, 0, layer.Name + ".jpg");
                    temp += "<div style='float: left;'>";
                    temp += "<div id='img' style='width:160px;height:25px;text-align:left;'>";
                    temp += "<img style='width:60px;height:20px;' src='" + imgPath + "'>";
                    temp += "" + layer.Name + "";
                    temp += "</div>";
                    temp += "</div>";
                    m++;
                }
                temp += "</div>";
                this.legendShow(temp, m);
            }
            if (Stamp.Tools.showMode === "custom") {//通过在stampmanager配置的颜色显示图例
                var m = 0;
                var temp = "<div id='content' style='width:100%;height:100%;overflow:auto;background:#eef5fd;'>";
                var projectId = SYSTEMPARAMS.project;
                var proLayer = this.Earth.LayerManager.GetLayerByGUID(projectId);
                var pipelineArr = LayerManagement.getPipeListByLayer(proLayer);

                for (var i = 0; i < pipelineArr.length; i++) {
                    var pipeline = pipelineArr[i];
                    var pipelineGuid = pipeline.id;
                    var layer = this.Earth.LayerManager.GetLayerByGUID(pipelineGuid);
                    var layerGuid = layer.Guid;
                    var color = layer.CustomColor;
                    color = color.toString(16);
                    color = color.substring(2);
                    temp += "<div style='float: left;'>";
                    temp += "<div id='img' style='width:160px;height:25px;text-align:left;'>";
                    temp += "<span style='width:60px;height:20px;background-color:#" + color + ";'><img style='width:60px;height:0px;' src=''></span>";
                    temp += "" + layer.Name + "";
                    temp += "</div>";
                    temp += "</div>";
                    m++;
                }
                temp += "</div>";
                this.legendShow(temp, m);
            }
        }
    },
    /**
     *完成获取路名功能
     * @param {number} num [0，隐藏道路名；1，显示道路名]
     */
    showRoadName: function (num) {
        var strCon = top.params.ip + "/dataquery?service=" + "road" + "&qt=17&project=" + top.SYSTEMPARAMS.project + "&pg=0," + 1000 + "&sc=" + "(3,1" + "," + "" + 1000 + ",";
        strCon = strCon + Stamp.Tools.Earth.GlobeObserver.Pose.Longitude + "," + Stamp.Tools.Earth.GlobeObserver.Pose.Latitude + ")";
        Stamp.Tools.Earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                if (xmlStr) {
                    var xmlDoc = loadXMLStr(xmlStr);
                    var json = $.xml2json(xmlDoc);
                    if (json == null) {
                        return null;
                    }
                    var roadName = "";
                    if (json.Result.num < 1) {
                        return;
                    } else if (json.Result.num == 1) {
                        roadName = json.Result.Record.NAME;
                    } else {
                        var RoadResultArr = [];
                        for (var i = 0; i < json.Result.num; i++) {
                            var name = json.Result.Record[i].NAME;
                            var coords = json.Result.Record[i].SHAPE.Polyline.Coordinates.split(",");
                            var vec3s = Stamp.Tools.Earth.Factory.CreateVector3s();
                            for (var j = 0; j < coords.length; j += 3) {
                                vec3s.Add(coords[j], coords[j + 1], coords[j + 2]);
                            }
                            var geopoint = Stamp.Tools.Earth.Factory.CreateGeoPoint();
                            geopoint.Longitude = Stamp.Tools.Earth.GlobeObserver.Pose.Longitude;
                            geopoint.Latitude = Stamp.Tools.Earth.GlobeObserver.Pose.Latitude;
                            geopoint.Altitude = Stamp.Tools.Earth.GlobeObserver.Pose.Altitude;
                            var result = Stamp.Tools.Earth.GeometryAlgorithm.CalculatePointPolylineDistance(vec3s, geopoint);
                            RoadResultArr.push([result.Length, name]);
                            if (RoadResultArr.length > 1) {
                                var a = RoadResultArr[RoadResultArr.length - 1];
                                var b = RoadResultArr[RoadResultArr.length - 2];
                                if (a[0] > b[0]) {
                                    RoadResultArr[RoadResultArr.length - 1] = b;
                                    RoadResultArr[RoadResultArr.length - 2] = a;
                                }
                            }
                            roadName = RoadResultArr[RoadResultArr.length - 1][1];
                        }
                    }
                    if (Stamp.Tools.Earth.GlobeObserver.Pose.Altitude > 1500) {
                        Stamp.Tools.Earth.Environment.ClearInformationText();
                    } else {
                        if (num == 0) {
                            Stamp.Tools.Environment.ClearInformationText();
                            return;
                        }
                        Stamp.Tools.Earth.Environment.SetScreenInformationText(Stamp.Tools.Earth.scrollWidth / 2, Stamp.Tools.Earth.scrollHeight / 2, roadName, 0xccffffff, 10, 21); //0000FF
                    }
                }
            }
        }
        Stamp.Tools.Earth.DatabaseManager.GetXml(strCon);
    },
    /**
     *显示道路名
     * @param {number} num [0，隐藏道路名；1，显示道路名]
     */
    roadName: function (num) {
        if (num == 0) {
            clearTimeout(timmerRoadName);
            Stamp.Tools.Earth.Event.OnObserverChanged = function () {
            };
            Stamp.Tools.Earth.Environment.ClearInformationText();
        } else {
            timmerRoadName = setTimeout(function () {
                Stamp.Tools.showRoadName(1);
            }, 1000);

            Stamp.Tools.Earth.Event.OnObserverChanged = function () {
                if (Stamp.Tools.Earth.GlobeObserver.Pose.Altitude > 1500) {
                    Stamp.Tools.Earth.Environment.ClearInformationText();
                } else {
                    var myDate = new Date();
                    var thisTime = myDate.getTime();
                    if ((thisTime - Stamp.Tools.lastSecond) / 1000 > 1) {
                        Stamp.Tools.Earth.Environment.ClearInformationText();
                        timmerRoadName = setTimeout(function () {
                            Stamp.Tools.showRoadName(1);
                        }, 1000);
                        Stamp.Tools.lastSecond = thisTime;
                    }
                }
            };
        }
    },
    /**
     * 显示弹出窗口,针对屏幕截图、出图以及管线更新功能
     * @param  {[string]} tag           [判断是哪个功能]
     * @return {[type]}               [description]
     */
    showMoveHtmlBalloons: function (tag) {
        // 清除上一个点击的菜单样式,给现在的加上样式
        if(Stamp.Tools.lastBalloonId){
            Tools.singleStyleCancel(Stamp.Tools.lastBalloonId);
        }
        var flag = Tools.toolBarItemClickStyle(tag);
        if(!flag){
            if (Stamp.Tools.htmlBalloonMove != null) {
                Stamp.Tools.htmlBalloonMove.DestroyObject();
                Stamp.Tools.htmlBalloonMove = null;
            }
            Stamp.Tools.lastBalloonId = null;
            return;
        }
        Stamp.Tools.lastBalloonId = tag;
        var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
        var url = "";
        var dval;
        var width = 270,
            height = 240;
        if (tag === "ViewScreenShot") {//屏幕截图
            url = loaclUrl + "/html/view/screenShot.html";
            dval = Stamp.Tools.Earth;
            width = 355;
            height = 260;
        } else if (tag === "ViewPictures") {//出图
            url = loaclUrl + "/html/view/pictures.html";
            dval = Stamp.Tools.Earth;
            width = 410;
            height = 390;
        } else if (tag === "ViewPipelineUpdate") {//管线更新
            url = loaclUrl + "/html/view/updateArea.html";
            width = 311;
            height = 313;
            dval = Stamp.Tools.Earth;
        }
        if (Stamp.Tools.htmlBalloonMove != null) {
            Stamp.Tools.htmlBalloonMove.DestroyObject();
            Stamp.Tools.htmlBalloonMove = null;
        }
        Stamp.Tools.htmlBalloonMove = Stamp.Tools.Earth.Factory.CreateHtmlBalloon(Stamp.Tools.Earth.Factory.CreateGuid(), "屏幕坐标窗体URL");
        Stamp.Tools.htmlBalloonMove.SetScreenLocation(width / 2 + top.dialogLeft, 0);
        Stamp.Tools.htmlBalloonMove.SetRectSize(width, height);
        Stamp.Tools.htmlBalloonMove.SetIsAddBackgroundImage(false);
        Stamp.Tools.htmlBalloonMove.ShowNavigate(url);
        Stamp.Tools.Earth.Event.OnDocumentReadyCompleted = function (guid) {
            dval.htmlBallon = Stamp.Tools.htmlBalloonMove;
            if (Stamp.Tools.htmlBalloonMove.Guid = guid) {
                dval.Tools = Tools;
                dval.thisMenu = Stamp.Tools.lastBalloonId;
                if (tag === "ViewPipelineUpdate") {
                    dval.params = params;
                    dval.CoordinateTransform = CoordinateTransform;
                    dval.SYSTEMPARAMS = SYSTEMPARAMS;
                    dval.dataProcess = getDataProcessIndex();
                    Stamp.Tools.htmlBalloonMove.InvokeScript("getEarth", dval);
                } else {
                    Stamp.Tools.htmlBalloonMove.InvokeScript("setTranScroll", dval);
                }
            }
        };
        Stamp.Tools.Earth.Event.OnHtmlBalloonFinished = function (guid) {
            Tools.singleStyleCancel(Stamp.Tools.lastBalloonId);
            Stamp.Tools.lastBalloonId = null;
            Stamp.Tools.Earth.ShapeCreator.Clear();
            Stamp.Tools.Earth.Event.OnHtmlBalloonFinished = function () {
            };
        };
    }
}

/*
 * 控制是否显示Slider
 * @param [number] flag [0:不显示，>0显示]
 */
function setSlidersVisible(flag) {
    flag > 0 ? ViewTranSettingBtn = true : ViewTranSettingBtn = false;
    var st = [{
        id: 'ViewTranSetting',
        type: 'transparency'
    }];
    sliderMgr.init(Stamp.Tools.Earth, false, function (type) {
        for (var i in st) {
            if (st[i].type == type) {//气泡关闭事件
                Tools.groupItemCancel(st[i].id);
                ViewTranSettingBtn = false;
                BalloonHtml.removeItemStyle(st[i].id);
            }
        }
    });
    for (var i = 0; i < st.length; i++) {
        sliderMgr.setVisible(st[i].type, flag & Math.pow(2, i));
    }
};
