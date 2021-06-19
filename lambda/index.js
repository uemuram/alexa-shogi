// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
// const lambda = new AWS.Lambda();

const CommonUtil = require('./CommonUtil.js');
const util = new CommonUtil();

const Logic = require('./Logic.js');
const logic = new Logic();

const Constant = require('./Constant');
const c = new Constant();

const Phase = require('./Phase');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

        // TODO 途中の対局があるかによって条件分岐

        // TODO 文言整備
        const speakOutput = 'ようこそ。新しい対局を始めますか?';
        const repromptOutput = '新しい対局を始めますか?';
        util.setState(handlerInput, c.CONFIRM_START_NEWGAME);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'はろー';

        const aplDocument = require('./apl/TemplateDocument.json');
        const aplDataSource = require('./apl/TemplateDataSource.json');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            // .addDirective({
            //     type: 'Alexa.Presentation.APL.RenderDocument',
            //     token: 'token',
            //     document: aplDocument,
            //     datasources: aplDataSource
            // })
            // .addDirective({
            //     type: 'Alexa.Presentation.APL.ExecuteCommands',
            //     token: 'token',
            //     commands: [
            //         {
            //             type: 'Idle',
            //             delay: 500,
            //             screenLock: true
            //         }
            //     ]
            // })
            // こんな感じでコマンドだけ送るのも可
            .addDirective({
                type: 'Alexa.Presentation.APL.ExecuteCommands',
                token: 'token',
                commands: [
                    {
                        type: "AnimateItem",
                        easing: "linear",
                        duration: 1500,
                        repeatCount: 0,
                        repeatMode: "restart",
                        // componentId: "speechText2",
                        componentId: "frame1",
                        value: [
                            {
                                property: "opacity",
                                to: 1
                            },
                            {
                                property: "transform",
                                from: [
                                    { rotate: 0 },
                                    { translateX: 0 },
                                    { scale: 1.0 }
                                ],
                                to: [
                                    { rotate: 40 },
                                    { translateX: 200, translateY: -50 },
                                    { scale: 0.8 }
                                ]
                            }
                        ]
                    }
                ]
            })
            // .addDirective({
            //     type: 'Alexa.Presentation.APL.ExecuteCommands',
            //     token: 'token',
            //     commands: [
            //         {
            //             type: 'SendEvent',
            //             "arguments": [
            //                 "test2"
            //             ]
            //         }
            //     ]
            // })
            .getResponse();
    }
};

// 対局開始
const GameStartIntentHandler = {
    canHandle(handlerInput) {
        return util.checkStrictSlotMatch(handlerInput, 'GameStartIntent', 'GameStartOrder')
            || util.checkIntentAndStateMatch(handlerInput, 'AMAZON.YesIntent', c.CONFIRM_START_NEWGAME);
    },
    async handle(handlerInput) {

        // TODO 盤面をセッションに記録
        // TODO 盤面をDynamoDBに記録

        // 盤面の初期化
        let phase = new Phase();
        phase.log();

        // 先手後手の分岐
        if (phase.isFirstPlayerUser()) {
            // ユーザが先手の場合

            // ユーザに手の発話を促す
            util.setState(handlerInput, c.REQUEST_USER_MOVE);
            return handlerInput.responseBuilder
                .speak('あなたの先手ばんで対局を開始します。どうぞ。')
                .getResponse();
        } else {
            // Alexaが後手の場合

            // Alexaの思考を予約する
            logic.startSearchNextMove(handlerInput, phase);

            // Alexaに手の検討を促す(リダイレクト)
            util.setState(handlerInput, c.REQUEST_ALEXA_MOVE);
            return handlerInput.responseBuilder
                .speak('Alexaの先手ばんで対局を開始します。')
                .getResponse();
        }
    }
};

// プレイヤーの差し手を受け付ける
const MoveIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MoveIntent';
    },
    async handle(handlerInput) {
        const speakOutput = '後手、まるまる飛車。';

        // TODO プレイヤーの手番かをチェック
        // TODO 可能な手か、反則手じゃないかをチェック
        // TODO 決着がついているかをチェック
        // TODO ひとつに定まらない手じゃないかをチェック(成る成らずとか)

        // TODO コンピュータに手を考えさせる
        await util.callDirectiveService(handlerInput, 'はちろくふですね。私の手番です。');
        console.log('テスト');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


// スキル終了
// 終了
const FinishIntentHandler = {
    canHandle(handlerInput) {
        return util.checkIntentAndStateMatch(handlerInput, 'AMAZON.NoIntent', c.CONFIRM_START_NEWGAME);
    },
    handle(handlerInput) {
        const speakOutput = 'ご利用ありがとうございました。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// テスト用
const TestOneIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TestOneIntent';
    },
    async handle(handlerInput) {
        // // 先手後手を決める
        // const firstPlayer = util.random(2) == 0 ? c.PLAYER_USER : c.PLAYER_ALEXA;
        // // 盤面の初期化
        // let phase = logic.getInitialPhase(firstPlayer);
        // // logic.logPhase(phase);
        // // 思考予約テスト
        // logic.startSearchNextMove(handlerInput, phase);

        return handlerInput.responseBuilder
            .speak(`テストいちです`)
            .reprompt('テストいちです')
            .getResponse();
    }
};

// テスト用
const TestTwoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TestTwoIntent';
    },
    async handle(handlerInput) {
        // const nextMove = await logic.getNextMoveFromKey(handlerInput);
        // console.log(nextMove);

        return handlerInput.responseBuilder
            .speak(`テストにです`)
            .reprompt('テストにです')
            .getResponse();
    }
};


// sendEventテスト
const TouchEventHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'Alexa.Presentation.APL.UserEvent' &&
            request.source.handler === 'External');
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        if (request.type === 'Alexa.Presentation.APL.UserEvent') {
            if (request.arguments) {
                // request.arguments[0]には、"button"が入っている
                const speechText = `${request.arguments[0]} がタップされました。`
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withShouldEndSession(true)
                    .getResponse();
            }
        }
        throw new Error("error");
    }
};

const PageChangedEventHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return ((request.type === 'Alexa.Presentation.APL.UserEvent' &&
            (request.source.handler === 'Page')));
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        if (request.type === 'Alexa.Presentation.APL.UserEvent') {
            if (request.arguments) {
                // request.arguments[0]には、"button"が入っている
                const speechText = `${request.arguments[0]} がページングされました。`
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withShouldEndSession(true)
                    .getResponse();
            }
        }
        throw new Error("error");
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// リクエストインターセプター(エラー調査用)
const RequestLog = {
    process(handlerInput) {
        //console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
        console.log('---------------------------------------------------------------------');
        console.log("HANDLER INPUT = " + JSON.stringify(handlerInput));
        console.log("REQUEST TYPE = " + Alexa.getRequestType(handlerInput.requestEnvelope));
        if (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest') {
            console.log("REQUEST NAME = " + Alexa.getIntentName(handlerInput.requestEnvelope));
        }
        return;
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,

        HelloWorldIntentHandler,
        TestOneIntentHandler,
        TestTwoIntentHandler,

        GameStartIntentHandler,
        MoveIntentHandler,
        FinishIntentHandler,
        TouchEventHandler,
        PageChangedEventHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .addRequestInterceptors(RequestLog)
    .lambda();
