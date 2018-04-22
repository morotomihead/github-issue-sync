function onOpen(){
  //メニュー配列
  var myMenu=[
    {name: "Issue同期", functionName: "importIssue"},
  ];
 
  SpreadsheetApp.getActiveSpreadsheet().addMenu("Github",myMenu); //メニューを追加 
}

function importIssue() {

  var GITHUB_OWNER = 'xxxxxxxxxx'; // レポジトリのオーナー名を入れてください
  var GITHUB_ACCESS_TOKEN = 'xxxxxxxxxxx'; // 上記で発行したaccess tokenを入れてください
  var REPOSITORIES = ['xxxxxxxx'] // 出したいレポジトリ名を入れてください

  //issuesの最新の番号
  var NEWEST_ISSUE_NUM = 1000; 

  // APIからissueのjsonを取得
  var getIssues = function(repository){
    //ページ数算出
    var total = Math.ceil(NEWEST_ISSUE_NUM / 30);
    //全ページ分fetch
    var j_obj = [];
    for(i = 1; i <= total; i++) {
      var url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + repository + '/issues?page=' + i +'&state=all&sort=created&direction=asc&access_token=' + GITHUB_ACCESS_TOKEN;
      var response = UrlFetchApp.fetch(url);

      var json = response.getContentText();
      Array.prototype.push.apply(j_obj,JSON.parse(json));
    }
    return j_obj;
  }

  // issueのjsonから中身を取得
  var getAttributesOfIssue = function(issue){
    var milestone = "";
    if(issue["milestone"]){
      milestone = issue["milestone"]["title"];
    }

    var labels = "";
    if(issue["labels"]){
      labels = issue["labels"].map(function(label){
        return label["name"]
      }).join(",");
    }

    var assignee = "";
    if(issue["assignee"]){
      assignee = issue["assignees"].map(function(assignee){
        return assignee["login"]
      }).join(",");
    }

    var due_on = "";
    if(issue["milestone"] && issue["milestone"]["due_on"]){
      due_on = issue["milestone"]["due_on"].substring(0, 10);
    }

    var opend_at = "";
    if(issue["created_at"]){
      opend_at = issue["created_at"].substring(0, 10);
    }

    var closed_at = "";
    if(issue["closed_at"]){
      closed_at = issue["closed_at"].substring(0, 10);
    }

    var url = '=HYPERLINK("' + issue["html_url"] + '","' + issue["number"] + '")';

    return [
      url,
      milestone,
      issue["title"],
      assignee,
      issue["state"],
      labels,
      due_on,
      opend_at,
      closed_at
    ]
  }

  var sortByValueOfIndex = function(ary, index){
    return ary.sort(function(a,b){
      if( a[index] < b[index] ) return -1;
      if( a[index] > b[index] ) return 1;
      return 0;
    });
  }

  // スプレッドシートを取得
  var ss = SpreadsheetApp.getActive()

  // 指定したレポジトリでシートに反映していく
  REPOSITORIES.forEach(function(repository){
    var issues = getIssues(repository).map(function(issue){
      return getAttributesOfIssue(issue);
    });

    // due on でソートしています
    //issues = sortByValueOfIndex(issues, 5);
    var titles = ["Issue URL","Milestone", "Title", "Assignee", "Status", "Labels", "due_on", "opened_at", "closed_at"];
    issues.unshift(titles);

    var sheet = ss.getSheetByName(repository);
    if(sheet == null) {
      ss.insertSheet(repository);
      sheet = ss.getSheetByName(repository);
    }
    sheet.getRange("B1:J" + (issues.length).toString()).setValues(issues);
  });
}

