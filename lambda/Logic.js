const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const Alexa = require('ask-sdk-core');

const CommonUtil = require('./CommonUtil.js');
const util = new CommonUtil();

const Constant = require('./Constant');
const c = new Constant();

const uuid = require('node-uuid');

class Logic {

    // 次の1手をエンジンに考えさせる
    async getNextMoveFromEngine(phase) {
        // 今までの指し手
        // const payload = JSON.stringify({
        //     "mode": "search",
        //     "moves": phase.history
        // });
        // const params = {
        //     FunctionName: "ask-shogi-engine2",
        //     InvocationType: "RequestResponse",
        //     Payload: payload
        // }

        const params = {
            FunctionName: "ask-shogi-engine2",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({
                "mode": "search",
                "moves": phase.history
            })
        }


        let result = await lambda.invoke(params).promise();
        console.log(`エンジン呼び出し結果 : ${JSON.stringify(result)}`);
        const nextMove = JSON.parse(JSON.parse(result.Payload).body).bestmove;
        return nextMove;
    }

    // 次の1手の検索を開始する
    startSearchNextMove(handlerInput, phase) {
        // 検索用のキーを生成
        const key = uuid.v4();
        console.log(`key : ${key}`);
        util.setSessionValue(handlerInput, 'searchKey', key);

        // レスポンスを使わないため、InvocationType : eventで呼び出し
        const params = {
            FunctionName: "ask-shogi-engine2",
            InvocationType: "Event",
            Payload: JSON.stringify({
                "mode": "search",
                "moves": phase.history,
                "key": key
            })
        }

        // 検索開始(結果は取得しない)
        lambda.invoke(params, (err, data) => {
            console.log(`done. err : ${JSON.stringify(err)}`);
            console.log(`done. data : ${JSON.stringify(data)}`);
        });
    }

    // 予約済みの次の1手を取得する
    async getNextMoveFromKey(handlerInput) {
        // 検索用のキーを取得
        const key = util.getSessionValue(handlerInput, 'searchKey');
        if (!key) {
            // キーが取得できない場合はエラー
            throw new Error('search key is not exist');
        }

        // 
        const params = {
            FunctionName: "ask-shogi-engine2",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({
                "mode": "load",
                "key": key
            })
        }

        // リトライ回数
        const maxCount = 5;
        let count = 0;
        let nextMove;
        let success = false;
        do {
            let result = await lambda.invoke(params).promise();
            count++;
            console.log(`result(${count}) :  ${JSON.stringify(result)}`);

            nextMove = JSON.parse(JSON.parse(result.Payload).body).bestmove;
            if (nextMove) {
                success = true;
                break;
            }
            await util.sleep(1000);
        } while (count < maxCount);

        if (success) {
            return nextMove;
        } else {
            throw new Error('次の手取得エラー');
        }
    }


    // スキル内商品の情報を取得する
    async getProductInfo(handlerInput) {
        const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();

        // 製品情報を取得
        const locale = handlerInput.requestEnvelope.request.locale;
        const products = await ms.getInSkillProducts(locale);

        // ステータスをチェック
        const product = products.inSkillProducts[0];
        const productId = product.productId;
        const entitled = product.entitled;
        console.log(`productId : ${productId}`);
        console.log(`entitled : ${entitled}`);

        return {
            productId: productId,
            entitled: entitled
        };
    }

    // // 拡張パック利用可能かどうかを判断する
    // async isEnitledExpansionPack(handlerInput) {
    //     const productInfo = await this.getProductInfo(handlerInput);
    //     if (productInfo.entitled == 'ENTITLED') {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // // 最初から計測する際のレスポンスを返す
    // getStartTimerResponse(handlerInput, message) {
    //     let response = handlerInput.responseBuilder;
    //     if (message) {
    //         response = response.speak(message);
    //     }
    //     const url = `${c.timerSoundUrlPrefix}0.mp3`;
    //     const token = this.generateToken(0);

    //     console.log(`計測開始 : ${token}`);
    //     return response
    //         .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null, c.audioMetaData)
    //         .getResponse();
    // }

    // // 再開する際のレスポンスを返す
    // getRestartTimerResponse(handlerInput, message) {
    //     let response = handlerInput.responseBuilder;
    //     const audioInfo = this.getAudioInfo(handlerInput);

    //     // 終了メッセージ再生中は再開しない
    //     if (audioInfo.token == c.timerFinishToken) {
    //         return response
    //             .addAudioPlayerStopDirective()
    //             .getResponse();
    //     }
    //     const url = `${c.timerSoundUrlPrefix}${audioInfo.idx}.mp3`;
    //     console.log(`計測再開 : ${audioInfo.token}(${audioInfo.offsetInMilliseconds}～)`);

    //     if (message) {
    //         response = response.speak(message);
    //     }
    //     return response
    //         .addAudioPlayerPlayDirective('REPLACE_ALL', url, audioInfo.token, audioInfo.offsetInMilliseconds, null, c.audioMetaData)
    //         .getResponse();
    // }

    // // ミリ秒を読み上げ可能な時間形式にする
    // getTimerStr(time) {
    //     time = Math.round(time / 10) * 10;
    //     let h = Math.floor(time / 3600000);
    //     time %= 3600000
    //     let m = Math.floor(time / 60000);
    //     time %= 60000;
    //     let s = Math.floor(time / 1000);
    //     time %= 1000;
    //     let ms = ('000' + time).slice(-4).substring(1, 3);
    //     let hhmmss = '';
    //     if (h > 0) {
    //         hhmmss = h + "時間" + m + "分" + s + "秒";
    //     } else if (m > 0) {
    //         hhmmss = m + "分" + s + "秒";
    //     } else {
    //         hhmmss = s + "秒";
    //     }
    //     const hhmmss_read = hhmmss.replace('間0分', '間0ふん');

    //     return {
    //         all: hhmmss + ms,
    //         hhmmss: hhmmss,
    //         hhmmss_read: hhmmss_read,
    //         ms: ms
    //     }
    // }

    // // audio関連の情報を返す
    // getAudioInfo(handlerInput) {
    //     const audioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
    //     const token = audioPlayer.token;
    //     console.log(`トークン : ${token}`);

    //     const match = token.match(new RegExp(`^${c.tokenPrefix}(.*)_.*$`));
    //     const idx = match ? Number(match[1]) : null;
    //     console.log(`index : ${idx}`);

    //     return {
    //         token: token,
    //         offsetInMilliseconds: audioPlayer.offsetInMilliseconds,
    //         idx: idx
    //     }
    // }

    // // トークンを発行する
    // // token_1_【文字列(ミリ秒)】
    // generateToken(idx) {
    //     return `${c.tokenPrefix}${idx}_${new Date().getTime().toString()}`;
    // }

}

module.exports = Logic;