// import express, { Request, Response, NextFunction } from "express";
import { createEventAdapter, SlackEventAdapter } from "@slack/events-api";
import { WebClient } from "@slack/web-api";
import client from "../../../libs/server/client";

const slackEvents = process.env.SLACK_SIGNING_SECRET
  ? createEventAdapter(process.env.SLACK_SIGNING_SECRET)
  : undefined;
const webClient = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN
  ? new WebClient(process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN)
  : undefined;

interface Player {
  id: number;
  position: number;
  name: string;
}

if (slackEvents && webClient) {
  slackEvents.on("app_mention", async (event) => {
    let text = event.text;
    console.log(text);
    if (text.startsWith("Reminder:")) {
      text = text.replace("Reminder:", "").trim();
    }
    const botId: string = text.split(" ")[0];
    const strJson: string = text.replace(botId, "").trim();
    if (strJson.length === 0) {
      console.log("wake up call");
      return;
    }

    let result: string[] = [];

    if (strJson === "밥조") {
      console.log("밥조를보내주겠다");
      // console.log("client", client);
      const players = await client.player.findMany();
      console.log(players);
      players.sort(
        (playerA: Player, playerB: Player) =>
          playerA.position - playerB.position
      );
      const members = players.map((player: Player) => player.name);
      result = getRandomMamma(members);
      for (let i = 0; i < result.length; i++) {
        await webClient.chat.postMessage({
          text: String(result[i]),
          channel: event.channel,
        });
      }
    } else {
      try {
        const query: any = JSON.parse(strJson);
        result = getRandomGroup(query);
      } catch (err) {
        result[0] = String(
          'Usage: {"names": "park, choi, kim, lee", "size":2 <optional, default: 4>, "message": "Lunch Teams" <optional>}'
        );
      }
    }
    console.log("Result", result);

    for (let i = 0; i < result.length; i++) {
      await webClient.chat.postMessage({
        text: String(result[i]),
        channel: event.channel,
      });
    }
  });
}

function getRandomMamma(arrNames: string[]): string[] {
  let result: string[] = [];
  result[0] = ":bento: 이번주 점심 멤버";

  shuffle(arrNames);

  const teamSize = 4;
  const nTeams: number = Math.ceil(arrNames.length / teamSize);
  const arrTeams: string[][] = new Array(nTeams);

  for (let i = 0; i < nTeams; i++) {
    arrTeams[i] = new Array();
  }
  let count = 0;
  for (let i = 0; i < teamSize; i++) {
    for (let j = 0; j < nTeams; j++) {
      if (count < arrNames.length) {
        arrTeams[j].push(arrNames[count]);
      }
      count = count + 1;
    }
  }

  const baseTeamName: number = "A".charCodeAt(0);
  for (let index = 0; index < arrTeams.length; index++) {
    result[index + 1] = String.fromCharCode(baseTeamName + index) + " 팀 - ";
    arrTeams[index].forEach((name: string) => {
      if (name as string) {
        result[index + 1] += "`" + name + "` ";
      }
    });
  }
  return result;
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomGroup(query: any): string[] {
  let result: string[] = [];
  try {
    if (query.names === undefined) {
      throw 'The parameter "names" is not defined';
    }
    const strNames = query.names as string;

    const teamSize: number = query.size
      ? (query.size as string)
        ? parseInt(query.size)
        : query.size
      : 4;

    result[0] = query.message as string | "Random Team Generator: ";

    const arrNames: string[] = strNames.replace(/\s/g, "").split(",");
    shuffle(arrNames);

    const nTeams: number = Math.ceil(arrNames.length / teamSize);
    const arrTeams: string[][] = new Array(nTeams);

    for (let i = 0; i < nTeams; i++) {
      arrTeams[i] = new Array();
    }
    let count = 0;
    for (let i = 0; i < teamSize; i++) {
      for (let j = 0; j < nTeams; j++) {
        if (count < arrNames.length) {
          arrTeams[j].push(arrNames[count]);
        }
        count = count + 1;
      }
    }

    const baseTeamName: number = "A".charCodeAt(0);
    for (let index = 0; index < arrTeams.length; index++) {
      result[index + 1] = String.fromCharCode(baseTeamName + index) + " 팀 - ";
      arrTeams[index].forEach((name: string) => {
        if (name as string) {
          result[index + 1] += "`" + name + "` ";
        }
      });
    }
  } catch (err) {
    console.log(err);
    result[0] = String(
      'Usage: {"names": "park, choi, kim, lee", "size":2 <optional, default: 4>, "message": "Lunch Teams" <optional>}'
    );
  } finally {
    return result;
  }
}

const listener = slackEvents?.requestListener();

export default listener;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
