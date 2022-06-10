import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import Card from "../components/card";
import { useQuery, useMutation, gql } from "@apollo/client";
import Layout from "../components/layout";
import Dealer from "../components/dealer";

const HOMEPAGE_URL = process.env.NEXT_PUBLIC_HOMEPAGE_URL;

const QUERY = gql`
  query StartingGrid {
    startingGrid {
      players {
        id
        position
        name
      }
      lastEditor
    }
  }
`;

const MUTATION = gql`
  mutation ReorderStaringGrid($newPlayers: [PlayerInput!]!) {
    reorderStartingGrid(newPlayers: $newPlayers) {
      players {
        id
        position
        name
      }
      lastEditor
    }
  }
`;

const SUBSCRIPTION = `
  subscription FeedStartingGrid {
    feedStartingGrid {
      players {
        id
        position
        name
      }
      lastEditor
    }
  }
`;

interface Player {
  id: number;
  position: number;
  name: string;
}

interface StartingGrid {
  players: Player[];
  lastEditor: String;
}

const Home: NextPage = (props) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastEditor, setLastEditor] = useState("");
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [pendingLastEditor, setPendingLastEditor] = useState("");
  const [sortableState, setSortableState] = useState("");
  const [lock, setLock] = useState(false);
  const lockRef = useRef<boolean>();

  useEffect(() => {
    lockRef.current = lock;
  }, [lock]);

  const { loading: loadingGetStartingGrid, error: errorGetStartingGrid } =
    useQuery(QUERY, {
      skip: players.length !== 0,
      onCompleted: (result) => {
        const currentEditor = result.startingGrid.lastEditor;
        const currentPlayers = result.startingGrid.players.map(
          (player: Player) => ({
            id: player.id,
            position: player.position,
            name: player.name,
          })
        );
        currentPlayers.sort(
          (playerA: Player, playerB: Player) =>
            playerA.position - playerB.position
        );
        setPlayers(currentPlayers);
        setLastEditor(currentEditor);
      },
    });

  const [reorderStartingGrid, {}] = useMutation(MUTATION);

  useEffect(() => {
    const url = new URL(HOMEPAGE_URL + "/api/graphql");
    url.searchParams.append("query", SUBSCRIPTION);

    const eventsource = new EventSource(url.toString(), {
      withCredentials: true, // This is required for cookies
    });

    eventsource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      const currentEditor = data.data.feedStartingGrid.lastEditor;
      const rcvdCurrentPlayers = data.data.feedStartingGrid.players;
      const currentPlayers = rcvdCurrentPlayers.map((player: Player) => ({
        id: player.id,
        position: player.position,
        name: player.name,
      }));
      currentPlayers.sort(
        (playerA: Player, playerB: Player) =>
          playerA.position - playerB.position
      );
      if (lockRef.current) {
        setPendingPlayers(currentPlayers);
        setPendingLastEditor(currentEditor);
      } else {
        setPlayers(currentPlayers);
        setLastEditor(currentEditor);
      }
    };
  }, [props]);

  useEffect(() => {
    if (players.length > 0) {
      const newPlayers = players.map((player: Player, index) => ({
        id: player.id,
        position: index,
        name: player.name,
      }));
      newPlayers.sort(
        (playerA: Player, playerB: Player) =>
          playerA.position - playerB.position
      );
      setPlayers(newPlayers);
      reorderStartingGrid({ variables: { newPlayers } });
    }
  }, [players.map((player: Player) => player.name).join()]);

  if (loadingGetStartingGrid) {
    return (
      <Layout>
        <div className="flex items-center justify-center space-x-2 pt-8 pb-4">
          <svg
            width="64"
            height="64"
            viewBox="0 0 57 57"
            xmlns="http://www.w3.org/2000/svg"
            stroke="#ff4c4c"
          >
            <g fill="#ff4c4c" fillRule="evenodd">
              <g transform="translate(1 1)" strokeWidth="2">
                <circle cx="5" cy="50" r="5">
                  <animate
                    attributeName="cy"
                    begin="0s"
                    dur="2.2s"
                    values="50;5;50;50"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    begin="0s"
                    dur="2.2s"
                    values="5;27;49;5"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="27" cy="5" r="5">
                  <animate
                    attributeName="cy"
                    begin="0s"
                    dur="2.2s"
                    from="5"
                    to="5"
                    values="5;50;50;5"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    begin="0s"
                    dur="2.2s"
                    from="27"
                    to="27"
                    values="27;49;5;27"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="49" cy="50" r="5">
                  <animate
                    attributeName="cy"
                    begin="0s"
                    dur="2.2s"
                    values="50;50;5;50"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    from="49"
                    to="49"
                    begin="0s"
                    dur="2.2s"
                    values="49;5;27;49"
                    calcMode="linear"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          </svg>
        </div>
      </Layout>
    );
  }
  if (errorGetStartingGrid) {
    console.log(errorGetStartingGrid);
    return (
      <Layout>
        <div className="flex items-center justify-center space-x-2">
          <p className="text-gray-500 leading-normal font-light">
            Something Went Wrong. Please Try Again.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-screen-xl container mx-auto">
        <Dealer text={lastEditor} />
        <ReactSortable
          list={players}
          setList={setPlayers}
          animation={150}
          group="player"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4"
          onChoose={(evt) => {
            setLock(true);
            setSortableState(evt.type);
          }}
          onStart={(evt) => {
            setLock(true);
            setSortableState(evt.type);
          }}
          onUnchoose={(evt) => {
            if (sortableState === "choose") {
              setLock(false);
              if (pendingPlayers.length > 0) {
                setPlayers(pendingPlayers);
                setLastEditor(pendingLastEditor);
                setPendingPlayers([]);
                setPendingLastEditor("");
              }
            }
            setSortableState(evt.type);
          }}
          onEnd={(evt) => {
            if (sortableState === "start") {
              setLock(false);
              if (evt.oldIndex === evt.newIndex) {
                if (pendingPlayers.length > 0) {
                  setPlayers(pendingPlayers);
                  setLastEditor(pendingLastEditor);
                  setPendingPlayers([]);
                  setPendingLastEditor("");
                }
              } else {
                setPendingPlayers([]);
                setPendingLastEditor("");
              }
            }
            setSortableState(evt.type);
          }}
        >
          {players.map((player) => (
            <Card
              key={player.id}
              position={player.position}
              name={player.name}
            />
          ))}
        </ReactSortable>
      </div>
    </Layout>
  );
};

export default Home;
