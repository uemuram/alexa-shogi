const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const Alexa = require('ask-sdk-core');

const CommonUtil = require('./CommonUtil.js');
const util = new CommonUtil();

const Constant = require('./Constant');
const c = new Constant();

class Logic {

    // 初期化された局面を取得する
    getInitialPhase(firstPlayer) {
        return {
            // 盤面
            board: util.deepCopy(c.initialBoard),
            // 持ち駒
            ownPiece: {
                // 先手番
                'first': util.deepCopy(c.initialOwnPiece),
                // 後手番
                'second': util.deepCopy(c.initialOwnPiece)
            },
            // 履歴
            history: [],
            // どちらのプレイヤー先手か
            firstPlayer: firstPlayer
        }
    }

    // 局面をログ表示する
    logPhase(phase) {
        let boardStr = '\n'; phase
        for (let i = 0; i < phase.board.length; i++) {
            for (let j = 0; j < phase.board[i].length; j++) {
                if (!phase.board[i][j]) {
                    boardStr += '  ';
                } else if (phase.board[i][j].length == 1) {
                    boardStr += ` ${phase.board[i][j]}`;
                } else {
                    boardStr += phase.board[i][j];
                }
            }
            boardStr += '\n';
        }
        console.log(boardStr);
        // TODO 集約して1ログで表示
        console.log(phase.ownPiece);
        console.log(phase.history);
        console.log(phase.firstPlayer);
    }

    // 次の1手をエンジンに考えさせる
    async getNextMoveFromEngine(phase) {
        // 今までの指し手
        const payload = JSON.stringify({
            "moves": phase.history
        });
        const params = {
            FunctionName: "ask-shogi-engine2",
            InvocationType: "RequestResponse",
            Payload: payload
        }
        let result = await lambda.invoke(params).promise();
        console.log(`エンジン呼び出し結果 : ${JSON.stringify(result)}`);
        const nextMove = JSON.parse(JSON.parse(result.Payload).body).bestmove;;
        return nextMove;
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