"use client";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Card = styled.div`
  padding: 10px;
  margin: 5px;
  border-radius: 8px;
  width: 200px;
  background-color: ${(props) =>
    props.gender === "F" ? "#ffb6c1" : "#add8e6"};
  position: relative;
  z-index: 1;
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
`;

const Tree = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  position: relative;
`;

const Arrows = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const SearchContainer = styled.div`
  margin: 20px;
  width: 100%;
  max-width: 600px;
`;

const SearchInput = styled.input`
  padding: 8px;
  margin: 5px;
  width: 200px;
`;

const SearchResults = styled.div`
  margin-top: 20px;
`;

const ResultCard = styled.div`
  padding: 10px;
  margin: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
`;

const initialPerson = {
  id: "1",
  firstName: "",
  lastName: "",
  gender: "M",
  dateOfBirth: "",
  parents: [],
  children: [],
  generation: 0,
};

function FamilyTree() {
  const [familyMembers, setFamilyMembers] = useState([initialPerson]);
  const [counter, setCounter] = useState(1);
  const [connections, setConnections] = useState([]);
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const savedFamilyMembers = localStorage.getItem("familyMembers");
    if (savedFamilyMembers) {
      setFamilyMembers(JSON.parse(savedFamilyMembers));
      const maxCounter = Math.max(
        ...JSON.parse(savedFamilyMembers).map((m) =>
          parseInt(m.id.split("-")[2] || 0)
        )
      );
      setCounter(maxCounter + 1);
    }
  }, []);

  useEffect(() => {
    if (familyMembers.length > 0) {
      localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
    }
  }, [familyMembers]);

  useEffect(() => {
    updateConnections();
  }, [familyMembers]);

  const updateConnections = () => {
    const newConnections = [];
    familyMembers.forEach((member) => {
      member.parents.forEach((parentId) => {
        const parentElement = cardRefs.current[parentId];
        const childElement = cardRefs.current[member.id];

        if (parentElement && childElement) {
          const parentRect = parentElement.getBoundingClientRect();
          const childRect = childElement.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          newConnections.push({
            x1: (parentRect.left + parentRect.right) / 2 - containerRect.left,
            y1: parentRect.bottom - containerRect.top,
            x2: (childRect.left + childRect.right) / 2 - containerRect.left,
            y2: childRect.top - containerRect.top,
          });
        }
      });
    });
    setConnections(newConnections);
  };

  const generateUniqueId = () => {
    const timestamp = Date.now().toString().slice(-6);
    setCounter((prev) => prev + 1);
    return `FM-${timestamp}-${counter}`;
  };

  const addMember = (type, relativeId) => {
    const parent = familyMembers.find((m) => m.id === relativeId);
    const newMember = {
      id: generateUniqueId(),
      firstName: "",
      lastName: "",
      gender: "M",
      dateOfBirth: "",
      parents: type === "child" ? [relativeId] : [],
      children: type === "parent" ? [relativeId] : [],
      generation:
        type === "child" ? parent.generation - 1 : parent.generation + 1,
    };

    setFamilyMembers((prev) => {
      const updatedMembers = [...prev, newMember];
      if (type === "parent") {
        return updatedMembers.map((m) =>
          m.id === relativeId
            ? { ...m, parents: [...m.parents, newMember.id] }
            : m
        );
      }
      return updatedMembers;
    });
  };

  const deleteMember = (id) => {
    if (familyMembers.length <= 1) {
      alert("Нельзя удалить последнего члена семьи");
      return;
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMember = (id, field, value) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSearch = () => {
    const results = familyMembers.filter((member) => {
      const firstNameMatch = member.firstName
        .toLowerCase()
        .includes(searchFirstName.toLowerCase());
      const lastNameMatch = member.lastName
        .toLowerCase()
        .includes(searchLastName.toLowerCase());

      if (searchFirstName && searchLastName) {
        return firstNameMatch && lastNameMatch;
      } else if (searchFirstName) {
        return firstNameMatch;
      } else if (searchLastName) {
        return lastNameMatch;
      }
      return false;
    });

    setSearchResults(results);
  };

  const renderTree = (generation) => {
    return (
      <Tree key={generation}>
        {familyMembers
          .filter((m) => m.generation === generation)
          .map((member) => (
            <Card
              key={member.id}
              gender={member.gender}
              ref={(el) => (cardRefs.current[member.id] = el)}
            >
              <input
                placeholder="Имя"
                value={member.firstName}
                onChange={(e) =>
                  updateMember(member.id, "firstName", e.target.value)
                }
              />
              <input
                placeholder="Фамилия"
                value={member.lastName}
                onChange={(e) =>
                  updateMember(member.id, "lastName", e.target.value)
                }
              />
              <select
                value={member.gender}
                onChange={(e) =>
                  updateMember(member.id, "gender", e.target.value)
                }
              >
                <option value="M">M</option>
                <option value="F">Ж</option>
              </select>
              <input
                type="date"
                value={member.dateOfBirth}
                onChange={(e) =>
                  updateMember(member.id, "dateOfBirth", e.target.value)
                }
              />
              <button onClick={() => addMember("parent", member.id)}>
                + родитель
              </button>
              <button onClick={() => addMember("child", member.id)}>
                + ребенок
              </button>
              <button onClick={() => deleteMember(member.id)}>Удалить</button>
            </Card>
          ))}
      </Tree>
    );
  };

  return (
    <>
      <SearchContainer>
        <SearchInput
          placeholder="Имя"
          value={searchFirstName}
          onChange={(e) => setSearchFirstName(e.target.value)}
        />
        <SearchInput
          placeholder="Фамилия"
          value={searchLastName}
          onChange={(e) => setSearchLastName(e.target.value)}
        />
        <button onClick={handleSearch}>Поиск</button>

        <SearchResults>
          {searchResults.map((person) => (
            <ResultCard key={person.id}>
              <p>
                <strong>Имя:</strong> {person.firstName} {person.lastName}
              </p>
              <p>
                <strong>Пол:</strong>{" "}
                {person.gender === "M" ? "М" : "Ж"}
              </p>
              <p>
                <strong>Дата рождения:</strong>{" "}
                {person.dateOfBirth || "Не указано"}
              </p>
            </ResultCard>
          ))}
          {searchResults.length === 0 &&
            (searchFirstName || searchLastName) && <p>Результаты не найдены</p>}
        </SearchResults>
      </SearchContainer>
      <TreeContainer ref={containerRef}>
        <Arrows>
          {connections.map((connection, index) => (
            <path
              key={index}
              d={`M ${connection.x1} ${connection.y1} C ${connection.x1} ${
                (connection.y1 + connection.y2) / 2
              }, ${connection.x2} ${(connection.y1 + connection.y2) / 2}, ${
                connection.x2
              } ${connection.y2}`}
              stroke="#666"
              strokeWidth="2"
              fill="none"
            />
          ))}
        </Arrows>
        {[...new Set(familyMembers.map((m) => m.generation))]
          .sort((a, b) => b - a)
          .map((gen) => renderTree(gen))}
      </TreeContainer>
    </>
  );
}

export default FamilyTree;
