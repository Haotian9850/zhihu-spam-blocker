const HIDE_REASON_MAP = {
    "KfeCollection-AnswerTopCard-Container": "付费内容",
    "KfeCollection-FabledStatement": "虚构创作",
    "LabelContainer": "虚构创作"    // possible, need secondary check
}   // key: badge name, value: reason

const blockAllKfeCollectionBadges = () => {
    // TODO add throttling to optimize
    let params = new URLSearchParams(window.location.search);
    const currUrl = $(location).attr("href");
    if (!currUrl.match(/zhihu.com/g)) {
        //console.log("Not a zhihu domain, not running extension...");
        return;
    }
    if (params.get("hideSpam") === "false") {
        return;
    }
    const kfeCollectionBadgeClzName = "KfeCollection-AnswerTopCard-Container";
    const kfeCollectionFabledAnsClzName = "KfeCollection-FabledStatement";
    const possibleFabledAnsClzName = "LabelContainer";
    const targetAnswerContainerClzName = "ContentItem AnswerItem";
    const allKfeCollectionBadges = $(`.${kfeCollectionBadgeClzName}`);
    const allKfeCollectionFabledAnsBadges = $(`.${kfeCollectionFabledAnsClzName}`);
    const allPossibleFabledBadge = $(`.${possibleFabledAnsClzName}`);
    const allSpamBadges = $.merge(allKfeCollectionFabledAnsBadges, $.merge(allKfeCollectionBadges, allPossibleFabledBadge));

    const makeShowSpamBtn = (answerDom) => {
        const answerUrl = extractSingleAnswerUrl(answerDom);
        return !!answerUrl ? `<button style="color:#2196F3"><a href="${answerUrl}" target="_blank"><b>跳转到此答案</b></a></button>` : "";
    }

    const makePlaceholderText = (hideReason) => {
        return !!hideReason ? `zhihu-spam-blocker为您拦截了此疑似垃圾答案 (原因：${hideReason})` : "zhihu-spam-blocker为您拦截了此疑似垃圾答案";
    }

    const extractSingleAnswerUrl = (answerDom) => {
        const answerId = answerDom.attr("name");
        const dataZaExtraModule = answerDom.attr("data-za-extra-module");
        const questionId = JSON.parse(dataZaExtraModule)?.card?.content?.parent_token;
        if (!!answerId && !!questionId) {
            return `https://zhihu.com/question/${questionId}/answer/${answerId}?hideSpam=false`;
        }
        return null;
    }

    const findHideReason = (clzAttr) => {
        const matchedKeys = Object.keys(HIDE_REASON_MAP).filter(h => clzAttr.includes(h));
        if (!!matchedKeys?.length){
            return HIDE_REASON_MAP[matchedKeys[0]];
        }
        return null;
    }

    allSpamBadges.each(function(k){
        if ($(this).attr("class").includes(possibleFabledAnsClzName)) {
            if (!$(this).text().match(/包含虚构创作/)){
                return; // e.g. continue
            }
        }
        const hideReason = findHideReason($(this).attr("class"));
        const parents = $(this).parents(5);
        let answerContainer = null;
        parents.each(function(p){
            const clzName = $(this).attr("class");
            if (!!clzName && clzName === targetAnswerContainerClzName){
                answerContainer = $(this);
                return false;   // e.g. break
            }
        });
        if (!!answerContainer) {
            answerContainer.hide();
            answerContainer.replaceWith(`<h2>${makePlaceholderText(hideReason)}&nbsp;${makeShowSpamBtn(answerContainer)}</h2>`);
        }
    });
}


const targetNode = document.body;
const config = {
    attributes: false,
    childList: true,
    subtree: true 
};
const observer = new MutationObserver(blockAllKfeCollectionBadges);
observer.observe(targetNode, config);