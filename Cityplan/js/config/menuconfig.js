
var lefts = lefts || {};
lefts.config = {
	"menu": [
		{
		"title": "场景浏览",
		"name": "场景浏览",
		"tag": "1",
		"src": "images/top/inactiveIcons/sceneBrowse.png",
		"srcd": "images/top/activeIcons/sceneBrowse.png",
		"id": "sceneBrowse",
		"item": [{
			"tag": "0101",
			"id": "ViewPointManagement",
			"name": "热点定位",
			"title": "热点定位",
			"src": "images/tools/视点管理.png"
		}, {
			"tag": "0102",
			"id": "track",
			"name": "飞行路径",
			"title": "飞行路径",
			"src": "images/tools/飞行路径.png",
			"srcd": "images/tools/飞行路径.png"
		}, {
			"id": "roam",
			"title": "人车漫游",
			"tag": "0103",
			"src": "images/tools/漫游.png",
			"srcd": "images/tools/漫游.png",
			"name": "人车漫游"
		}, {
			"title": "场景环绕",
			"tag": "0104",
			"src": "images/tools/旋转球.png",
			"srcd": "images/tools/旋转球.png",
			"id": "surround",
			"name": "场景环绕"
		}, {
            "id": "clipScene",
            "title": "场景剖切",
            "name": "场景剖切",
            "src": "images/tools/高级编辑.png",
            "tag": "0105"
        },{
			"title": "动画管理",
			"tag": "0106",
			"src": "images/tools/动画.png",
			"srcd": "images/tools/动画.png",
			"id": "animation",
			"name": "动画管理"
		}, {
			"id": "Hawkeye2D",
			"title": "二维鹰眼",
			"name": "二维鹰眼",
			"src": "images/tools/鹰眼图.png",
			"tag": "0107"
		},{
            "title": "二维地图",
            "tag": "0108",
            "src": "images/tools/二维地图.png",
            "srcd": "images/tools/二维地图.png",
            "id": "dimenShowHide",
            "name": "二维地图"
        },{
            "title": "二维叠加",
            "tag": "0109",
            "src": "images/tools/二维叠加.png",
            "srcd": "images/tools/二维叠加.png",
            "id": "dimenCover",
            "name": "二维叠加"
        },{
			"title": "二维联动",
			"tag": "0110",
			"src": "images/tools/二三维展示.png",
			"srcd": "images/tools/二三维展示.png",
			"id": "dimenLink",
			"name": "二维联动"
		},{
			"id": "ViewSystemSetting",
			"title": "系统设置",
			"name": "系统设置",
			"src": "images/tools/系统设置.png",
			"tag": "0111"
		}]
	}, {
		"title": "方案编辑",
		"tag": "2",
		"src": "images/top/inactiveIcons/planProject.png",
		"srcd": "images/top/activeIcons/planProject.png",
		"id": "planProject",
		"name": "方案编辑",
		"item": [{
			"title": "方案导入",
			"tag": "0201",
			"src": "images/tools/方案导入.png",
			"srcd": "images/tools/方案导入.png",
			"id": "projectLeadingin",
			"name": "方案导入"
		}, {
			"title": "地形平整",
			"tag": "0202",
			"src": "images/tools/地形平整.png",
			"srcd": "images/tools/地形平整.png",
			"id": "terrainSmooth",
			"name": "地形平整"
		}, {
			"title": "方案高程",
			"tag": "0203",
			"src": "images/tools/高程调整.png",
			"srcd": "images/tools/高程调整.png",
			"id": "divChangeHeight",
			"name": "方案高程"
		},{
            "title": "位置调整",
            "tag": "0204",
            "src": "images/tools/位置调整.png",
            "srcd": "images/tools/位置调整.png",
            "id": "editPosition",
            "name": "位置调整"
        },{
            "title": "方位调整",
            "tag": "0205",
            "src": "images/tools/方位调整.png",
            "srcd": "images/tools/方位调整.png",
            "id": "editProgramme",
            "name": "方位调整"
        },{
            "title": "楼高调整",
            "tag": "0206",
            "src": "images/tools/楼高调整.png",
            "srcd": "images/tools/楼高调整.png",
            "id": "editFloor",
            "name": "楼高调整"
        },{
            "title": "基底调整",
            "tag": "0207",
            "src": "images/tools/基底调整.png",
            "srcd": "images/tools/基底调整.png",
            "id": "editBasal",
            "name": "基底调整"
        },{
            "title": "删除对象",
            "tag": "0208",
            "src": "images/tools/删除对象.png",
            "srcd": "images/tools/删除对象.png",
            "id": "delete",
            "name": "删除对象"
        },{
            "title": "材质编辑",
            "tag": "0209",
            "src": "images/tools/材质编辑.png",
            "srcd": "images/tools/材质编辑.png",
            "id": "replaceTexture",
            "name": "材质编辑"
        },{
            "title": "简单建筑",
            "tag": "0210",
            "src": "images/tools/简单建筑.png",
            "srcd": "images/tools/简单建筑.png",
            "id": "simplebuilding",
            "name": "简单建筑"
        },{
            "title": "导入楼块",
            "tag": "0211",
            "src": "images/tools/导入楼块.png",
            "srcd": "images/tools/导入楼块.png",
            "id": "importAlbuginea",
            "name": "导入楼块"
        },{
            "title": "添加楼块",
            "tag": "0212",
            "src": "images/tools/添加楼块.png",
            "srcd": "images/tools/添加楼块.png",
            "id": "addAlbuginea",
            "name": "添加楼块"
        },{
            "title": "导入模型",
            "tag": "0213",
            "src": "images/tools/指标查看.png",
            "srcd": "images/tools/指标查看.png",
            "id": "importModel",
            "name": "导入模型"
        },{
            "title": "添加模型",
            "tag": "0214",
            "src": "images/tools/添加模型.png",
            "srcd": "images/tools/添加模型.png",
            "id": "model",
            "name": "添加模型"
        }]
	}, {
		"title": "方案审批",
		"tag": "3",
		"src": "images/top/inactiveIcons/normalAna.png",
		"srcd": "images/top/activeIcons/normalAna.png",
		"id": "normalAna",
		"name": "方案审批",
		"item": [{
            "title": "附件查看",
            "tag": "0301",
            "src": "images/tools/附件查看.png",
            "srcd": "images/tools/附件查看.png",
            "id": "attachment",
            "name": "附件查看"
        },{
            "title": "方案指标",
            "tag": "0302",
            "src": "images/tools/方案指标.png",
            "srcd": "images/tools/方案指标.png",
            "id": "buildingIndex",
            "name": "方案指标"
        },{
            "title": "方案比选",
            "tag": "0303",
            "src": "images/tools/方案比选.png",
            "srcd": "images/tools/方案比选.png",
            "id": "divContrastProject",
            "name": "方案比选"
        },{
            "title": "控高分析",
            "tag": "0304",
            "src": "images/tools/控高分析.png",
            "srcd": "images/tools/控高分析.png",
            "id": "heightControl",
            "name": "控高分析"
        }, {
            "title": "退让分析",
            "tag": "0305",
            "src": "images/tools/退让分析.png",
            "srcd": "images/tools/退让分析.png",
            "id": "redLine",
            "name": "退让分析"
        },{
			"title": "定点观察",
			"tag": "0306",
			"src": "images/tools/定点观察.png",
			"srcd": "images/tools/定点观察.png",
			"id": "mFixedObserver",
			"name": "定点观察"
		}, {
			"title": "通视分析",
			"tag": "0307",
			"src": "images/tools/通视分析.png",
			"srcd": "images/tools/通视分析.png",
			"id": "mLineSight",
			"name": "通视分析"
		},{
			"title": "视域分析",
			"tag": "0308",
			"src": "images/tools/视域分析.png",
			"srcd": "images/tools/视域分析.png",
			"id": "mViewshed",
			"name": "视域分析"
		},{
            "title": "沿路通视",
            "tag": "0309",
            "src": "images/tools/沿路通视.png",
            "srcd": "images/tools/沿路通视.png",
            "id": "mRoadLineSight",
            "name": "沿路通视"
        },{
            "title": "建筑间距",
            "tag": "0310",
            "src": "images/tools/建筑间距.png",
            "srcd": "images/tools/建筑间距.png",
            "id": "mFloorToFloor",
            "name": "建筑间距"
        },{
			"title": "阴影分析",
			"tag": "0311",
			"src": "images/tools/阴影分析.png",
			"srcd": "images/tools/阴影分析.png",
			"id": "mShinning",
			"name": "阴影分析"
		}, {
			"title": "日照分析",
			"tag": "0312",
			"src": "images/tools/日照分析.png",
			"srcd": "images/tools/日照分析.png",
			"id": "mInsolation",
			"name": "日照分析"
		}, {
			"title": "沿街立面",
			"tag": "0313",
			"src": "images/tools/天际线分析.png",
			"srcd": "images/tools/天际线分析.png",
			"id": "mSkyline",
			"name": "沿街立面"
		},{
			"title": "淹没分析",
			"tag": "0314",
			"src": "images/tools/流域分析.png",
			"srcd": "images/tools/流域分析.png",
			"id": "mValley",
			"name": "淹没分析"
		},{
            "title": "审批纪要",
            "tag": "0215",
            "src": "images/tools/审批纪要.png",
            "srcd": "images/tools/审批纪要.png",
            "id": "approveTag",
            "name": "审批纪要"
        }]
	},{
		"title": "辅助规划",
		"tag": "4",
		"src": "images/top/inactiveIcons/aidedPlan.png",
		"srcd": "images/top/activeIcons/aidedPlan.png",
		"id": "aidedPlan",
		"name": "辅助规划",
		"item": [ {
            "title": "用地平衡",
            "tag": "0401",
            "src": "images/tools/用地平衡.png",
            "srcd": "images/tools/用地平衡.png",
            "id": "balance",
            "name": "用地平衡"
        },{
            "title": "限高分析",
            "tag": "0402",
            "src": "images/tools/限高分析.png",
            "srcd": "images/tools/限高分析.png",
            "id": "highLimit",
            "name": "限高分析"
        },{
            "title": "指标核算",
            "tag": "0403",
            "src": "images/tools/指标核算.png",
            "srcd": "images/tools/指标核算.png",
            "id": "quotaAccount",
            "name": "指标核算"
        },{
            "title": "绿地分析",
            "tag": "0404",
            "src": "images/tools/绿地分析.png",
            "srcd": "images/tools/绿地分析.png",
            "id": "greenLandAly",
            "name": "绿地分析"
        },{
            "title": "选址分析",
            "tag": "0405",
            "src": "images/tools/选址分析.png",
            "srcd": "images/tools/选址分析.png",
            "id": "selectPlace",
            "name": "选址分析"
        },{
            "title": "拆迁分析",
            "tag": "0406",
            "src": "images/tools/拆迁分析.png",
            "srcd": "images/tools/拆迁分析.png",
            "id": "demolition",
            "name": "拆迁分析"
        },{
            "title": "空间查询",
            "tag": "0407",
            "src": "images/tools/空间查询.png",
            "srcd": "images/tools/空间查询.png",
            "id": "spatialQuery",
            "name": "空间查询"
        },{
            "title": "关键字查询",
            "tag": "0408",
            "src": "images/tools/关键字查询.png",
            "srcd": "images/tools/关键字查询.png",
            "id": "keywordQuery",
            "name": "关键字查询"
        },{
                "title": "SQL查询",
                "tag": "0409",
                "src": "images/tools/SQL查询.png",
                "srcd": "images/tools/SQL查询.png",
                "id": "complexQuery",
                "name": "SQL查询"
		}]
	},{
		"title": "管线分析",
		"tag": "5",
		"src": "images/top/inactiveIcons/pipelineAna.png",
		"srcd": "images/top/activeIcons/pipelineAna.png",
		"id": "pipelineAna",
		"name": "管线分析",
		"item": [{
				"title": "碰撞分析",
				"tag": "0501",
				"src": "images/tools/碰撞分析.png",
				"srcd": "images/tools/碰撞分析.png",
				"id": "AnalysisCollision",
				"name": "碰撞分析"
			},{
				"title": "覆土分析",
				"tag": "0502",
				"src": "images/tools/覆土分析.png",
				"srcd": "images/tools/覆土分析.png",
				"id": "AnalysisCoveringDepth",
				"name": "覆土分析"
			},{
				"title": "设施搜索",
				"tag": "0503",
				"src": "images/tools/设施搜索.png",
				"srcd": "images/tools/设施搜索.png",
				"id": "AnalysisAttachmentSearch",
				"name": "设施搜索"
			},{
				"title": "爆管分析",
				"tag": "0504",
				"src": "images/tools/爆管分析.png",
				"srcd": "images/tools/爆管分析.png",
				"id": "AnalysisBurst",
				"name": "爆管分析"
			},{
				"title": "流向分析",
				"tag": "0505",
				"src": "images/tools/流向分析.png",
				"srcd": "images/tools/流向分析.png",
				"id": "AnalysisFlowShowing",
				"name": "流向分析"
			},{
				"title": "横断面分析",
				"tag": "0506",
				"src": "images/tools/横断面.png",
				"srcd": "images/tools/横断面.png",
				"id": "AnalysisTranSection",
				"name": "横断面分析"
			},{
				"title": "纵断面分析",
				"tag": "0507",
				"src": "images/tools/纵断面.png",
				"srcd": "images/tools/纵断面.png",
				"id": "AnalysisCrossSection",
				"name": "纵断面分析"
			},{
				"title": "开挖分析",
				"tag": "0508",
				"src": "images/tools/开挖分析.png",
				"srcd": "images/tools/开挖分析.png",
				"id": "AnalysisExcava",
				"name": "开挖分析"
			},{
				"title": "智能排管",
				"tag": "0509",
				"src": "images/tools/智能排管.png",
				"srcd": "images/tools/智能排管.png",
				"id": "AnalysisPipel",
				"name": "智能排管"
			},{
				"title": "隧道分析",
				"tag": "0510",
				"src": "images/tools/隧道分析.png",
				"srcd": "images/tools/隧道分析.png",
				"id": "tunnelAnalysis",
				"name": "隧道分析"
        	},{
				"title": "管线标注",
				"tag": "0511",
				"src": "images/tools/管线标注.png",
				"srcd": "images/tools/管线标注.png",
				"id": "pipelineMark",
				"name": "管线标注",
				"item": [{
					"title": "标高标注",
					"tag": "1",
					"src": "images/panelMenu/inactiveIcons/标高标注.png",
					"srcd": "images/panelMenu/activeIcons/标高标注.png",
					"id": "MarkedElevation",
					"name": "标高标注"
				},{
					"title": "管径标注",
					"tag": "2",
					"src": "images/panelMenu/inactiveIcons/管径标注.png",
					"srcd": "images/panelMenu/activeIcons/管径标注.png",
					"id": "MarkedDiameter",
					"name": "管径标注"
				},{
					"title": "埋深标注",
					"src": "images/panelMenu/inactiveIcons/埋深标注.png",
					"srcd": "images/panelMenu/activeIcons/埋深标注.png",
					"id": "MarkedCoveringDepth",
					"name": "埋深标注",
					"tag":"3"
				},{
					"title": "坐标标注",
					"tag": "4",
					"src": "images/panelMenu/inactiveIcons/坐标标注.png",
					"srcd": "images/panelMenu/activeIcons/坐标标注.png",
					"id": "MarkedCoordinates",
					"name": "坐标标注"
				},{
                    "name":"坡度标注",
                    "title":"坡度标注",
                    "tag":"5",
                    "id":"MarkedSlope",
                    "src":"images/panelMenu/inactiveIcons/坡度标注.png",
                    "srcd":"images/panelMenu/activeIcons/坡度标注.png"
                },
                {
                    "name":"弯头标注",
                    "title":"弯头标注",
                    "tag":"6",
                    "id":"MarkedCurvedAngle",
                    "src":"images/panelMenu/inactiveIcons/弯头标注.png",
                    "srcd":"images/panelMenu/activeIcons/弯头标注.png"
                },
                {
                    "name":"栓点标注",
                    "title":"栓点标注",
                    "tag":"7",
                    "id":"MarkedAngleAndLength",
                    "src":"images/panelMenu/inactiveIcons/栓点标注.png",
                    "srcd":"images/panelMenu/activeIcons/栓点标注.png"
                },
                {
                    "name":"扯旗标注",
                    "title":"扯旗标注",
                    "tag":"8",
                    "id":"MarkedComplex",
                    "src":"images/panelMenu/inactiveIcons/扯旗标注.png",
                    "srcd":"images/panelMenu/activeIcons/扯旗标注.png"
                },
                {
                    "name":"自定义标注",
                    "title":"自定义标注",
                    "tag":"9",
                    "id":"MarkedCustomPart",
                    "src":"images/panelMenu/inactiveIcons/自定义标注.png",
                    "srcd":"images/panelMenu/activeIcons/自定义标注.png"
                }]
			}]
	}, {
            "title": "常用工具",
            "tag": "6",
            "src": "images/top/inactiveIcons/commonTools.png",
            "srcd": "images/top/activeIcons/commonTools.png",
            "id": "commonTools",
            "name": "常用工具",
            "item": [ {
                "id": "mHorizontalDis",
                "title": "水平距离测量",
                "name": "水平距离",
                "src": "images/tools/水平距离.png",
                "tag": "0601"
            }, {
                "id": "mVerticalDis",
                "title": "垂直距离测量",
                "name": "垂直距离",
                "src": "images/tools/垂直距离.png",
                "tag": "0602"
            }, {
                "id": "mSpaceDis",
                "title": "空间距离测量",
                "name": "空间距离",
                "src": "images/tools/空间距离.png",
                "tag": "0603"
            }, {
                "id": "mFlatArea",
                "title": "水平面积测量",
                "name": "水平面积",
                "src": "images/tools/水平面积.png",
                "tag": "0604"
            }, {
                "id": "mSurfaceArea",
                "title": "地表面积测量",
                "name": "地表面积",
                "src": "images/tools/面积.png",
                "tag": "0605"
            },{
                "id": "mPlaneAngle",
                "title": "平面角度测量",
                "name": "角度",
                "src": "images/tools/角度测量.png",
                "tag": "0606"
            },{
                "title": "坐标获取",
                "tag": "0607",
                "src": "images/tools/坐标获取.png",
                "srcd": "images/tools/坐标获取.png",
                "id": "Coordinate",
                "name": "坐标获取"
            }, {
                "title": "屏幕截图",
                "tag": "0608",
                "src": "images/tools/屏幕截图.png",
                "srcd": "images/tools/屏幕截图.png",
                "id": "screenShot",
                "name": "屏幕截图"
            }, {
                "title": "2.5D出图",
                "tag": "0609",
                "src": "images/tools/出图.png",
                "srcd": "images/tools/出图.png",
                "id": "pictures",
                "name": "2.5D出图"
            }]
        }]
	}
