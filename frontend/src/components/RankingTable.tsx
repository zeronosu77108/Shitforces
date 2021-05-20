import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Pagination from 'react-bootstrap/Pagination';
import Table from 'react-bootstrap/Table';
import { toProblemLabel } from '../functions/toProblemLabel';
import { ProblemInfo, RankingInfo, RankingInfoAccount } from '../types';

const ACCOUNTS_PER_PAGE = 20;

function formatSecondToMMSS(ms: number): string {
  const mm = Math.floor(ms / 60);
  const ss = ('00' + Math.floor(ms % 60)).slice(-2);
  return `${mm}:${ss}`;
}

interface RankingTableRowProps {
  account: RankingInfoAccount;
  isMe: boolean;
  problems: ProblemInfo[];
}

type RowTemplateProps = {
  ranking: number;
  accountName: string;
  score: number;
  penalty: number;
};
const RowTemplate: React.VFC<RowTemplateProps> = ({
  ranking,
  accountName,
  score,
  penalty,
}) => (
  <>
    <td className="align-middle text-center">{ranking}</td>
    <td className="align-middle font-weight-bold">{accountName}</td>
    <td className="align-middle text-center">
      <div className="font-weight-bold text-primary">{score}</div>
      <div className="text-muted">{formatSecondToMMSS(penalty)}</div>
    </td>
  </>
);

type PlayerStatusProps = {
  problemId: number;
  point: number;
  time: number;
};
const PlayerStatusOfProblem: React.VFC<PlayerStatusProps> = ({
  problemId,
  point,
  time,
}) => (
  <td key={problemId} className="align-middle text-center">
    <div className="font-weight-bold text-success">{point}</div>
    <div className="text-muted">{formatSecondToMMSS(time)}</div>
  </td>
);

export const RankingTableRow: React.FC<RankingTableRowProps> = ({
  account,
  isMe,
  problems,
}) => {
  return (
    <tr className={isMe ? 'table-info' : undefined}>
      <RowTemplate
        ranking={account.ranking}
        accountName={account.accountName}
        score={account.score}
        penalty={account.penalty}
      />

      {problems.map((problem) => {
        const accountAcceptIdx = account.acceptList.findIndex(
          (v) => v === problem.indexOfContest
        );
        if (accountAcceptIdx === -1) {
          return (
            <td key={problem.id} className="align-middle text-center">
              -
            </td>
          );
        }
        return (
          <PlayerStatusOfProblem
            key={problem.id}
            problemId={problem.id}
            point={problem.point}
            time={account.acceptTimeList[problem.indexOfContest]}
          />
        );
      })}
    </tr>
  );
};

interface Props {
  myAccountName: string | null;
  problems: ProblemInfo[];
  ranking: RankingInfo;
}

export const RankingTable: React.FC<Props> = ({
  myAccountName,
  problems,
  ranking,
}) => {
  const [accountNameToSearch, setAccountNameToSearch] = useState('');

  const onChangeAccountName = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setAccountNameToSearch(event.target.value);
  }, []);

  const onClickReset = useCallback(() => {
    setAccountNameToSearch('');
  }, []);

  const sortedProblems = useMemo(
    () => problems.sort((a, b) => a.indexOfContest - b.indexOfContest),
    [problems]
  );

  const filteredAccounts = useMemo(() => {
    const uniqueAccounts = new Map<string, RankingInfoAccount>();
    for (const account of ranking.rankingList) {
      uniqueAccounts.set(account.accountName, account);
    }

    let accounts = Array.from(uniqueAccounts.values());

    accounts = accounts.filter((v) =>
      v.accountName.startsWith(accountNameToSearch)
    );

    accounts = accounts.sort((a, b) => {
      if (a.ranking !== b.ranking) return a.ranking - b.ranking;
      return a.penalty - b.penalty;
    });

    return accounts;
  }, [ranking.rankingList, accountNameToSearch]);

  const paginationLength = useMemo(
    () => Math.ceil(filteredAccounts.length / ACCOUNTS_PER_PAGE),
    [filteredAccounts.length]
  );

  const [paginationIndex, setPaginationIndex] = useState(0);

  useEffect(() => {
    if (paginationLength === 0) {
      if (paginationIndex !== 0) setPaginationIndex(0);
      return;
    }

    if (paginationLength <= paginationIndex) {
      setPaginationIndex(paginationLength - 1);
    }
  }, [paginationIndex, paginationLength]);

  const pagenatedAccounts = useMemo(
    () =>
      filteredAccounts.filter(
        (v, i) =>
          (paginationIndex * ACCOUNTS_PER_PAGE <= i &&
            i < (paginationIndex + 1) * ACCOUNTS_PER_PAGE) ||
          v.accountName === myAccountName
      ),
    [myAccountName, filteredAccounts, paginationIndex]
  );

  const paginationItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < Math.max(1, paginationLength); i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === paginationIndex}
          onClick={() => {
            setPaginationIndex(i);
          }}
        >
          {i + 1}
        </Pagination.Item>
      );
    }
    return items;
  }, [paginationIndex, paginationLength]);

  const firstAcceptRow = useMemo(
    () => (
      <tr className="small text-center text-nowrap">
        <th colSpan={3} className="align-middle font-weight-normal">
          最速正解者
        </th>
        {ranking.firstAcceptedList.map((account) => {
          if (account === null) {
            return <th />;
          } else {
            return (
              <th
                key={account.name}
                className="align-middle font-weight-normal"
              >
                {account.name}
              </th>
            );
          }
        })}
      </tr>
    ),
    [ranking.firstAcceptedList]
  );

  const acPerSubmitRow = useMemo(
    () => (
      <tr className="small text-center text-nowrap">
        <th colSpan={3} className="align-middle font-weight-normal">
          <span className="font-weight-bold text-success">正解者数</span> /
          提出者数
        </th>
        {ranking.acPerSubmit.map(({ first, second }, i) => (
          <th key={i} className="align-middle font-weight-normal">
            <span className="font-weight-bold text-success">{first}</span> /{' '}
            {second}
          </th>
        ))}
      </tr>
    ),
    [ranking.acPerSubmit]
  );

  if (problems.length && problems.length !== ranking.acPerSubmit.length) {
    return <Alert variant="danger">Error</Alert>;
  }

  return (
    <>
      <div className="mb-4">
        <Form inline>
          <Form.Label className="mr-2" htmlFor="ranking-table-form-username">
            ユーザ名
          </Form.Label>
          <Form.Control
            className="mr-2"
            id="ranking-table-form-username"
            onChange={onChangeAccountName}
            value={accountNameToSearch}
          />
          <Button onClick={onClickReset} variant="secondary">
            リセット
          </Button>
        </Form>
      </div>

      <Table size="sm" striped bordered hover responsive>
        <thead>
          <tr className="text-center text-nowrap">
            <th style={{ minWidth: '3em' }}>順位</th>
            <th style={{ minWidth: '10em' }}>ユーザ</th>
            <th style={{ minWidth: '4em' }}>得点</th>
            {sortedProblems.map((problem) => (
              <th key={problem.id} style={{ minWidth: '4em' }}>
                {toProblemLabel(problem.indexOfContest)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {acPerSubmitRow}
          {pagenatedAccounts.map((account, i) => (
            <RankingTableRow
              key={i}
              account={account}
              problems={sortedProblems}
              isMe={account.accountName === myAccountName}
            />
          ))}
          {firstAcceptRow}
        </tbody>
        <tfoot>{acPerSubmitRow}</tfoot>
      </Table>

      <div className="mb-4">
        <Pagination className="justify-content-center">
          {paginationItems}
        </Pagination>
      </div>
    </>
  );
};
